import { ReviewLike } from "../models/ReviewLike.js";
import { User } from "../models/User.js";
import { Review } from "../models/Review.js";

/** Inicializa ReviewLikes de ejemplo después de crear sus dependencias. */
export async function initializeReviewLikes(users, reviews, options = {}) {
  const records = [];
  // Cada reseña recibe reacciones de los otros dos usuarios, sin likes del propio autor.
  for (const review of reviews) {
    for (const user of users.filter((user) => user.id !== review.user_id)) {
      const data = { user_id: user.id, review_id: review.id };
      await ReviewLike.build(data).validate();
      if (!await User.findByPk(user.id, options)) throw new Error("Invalid reference: ReviewLike.user_id");
      if (!await Review.findByPk(review.id, options)) throw new Error("Invalid reference: ReviewLike.review_id");
      const [record] = await ReviewLike.findOrCreate({ where: data, defaults: {}, ...options });
      records.push(record);
    }
  }

  for (const record of records) {
    await record.validate();
    if (record.user_id != null && !await User.findByPk(record.user_id, options)) {
      throw new Error("Invalid reference: ReviewLike.user_id");
    }
    if (record.review_id != null && !await Review.findByPk(record.review_id, options)) {
      throw new Error("Invalid reference: ReviewLike.review_id");
    }
  }
  return records;
}
