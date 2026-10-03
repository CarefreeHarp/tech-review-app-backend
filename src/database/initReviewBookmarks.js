import { ReviewBookmark } from "../models/ReviewBookmark.js";
import { User } from "../models/User.js";
import { Review } from "../models/Review.js";

/** Inicializa ReviewBookmarks de ejemplo después de crear sus dependencias. */
export async function initializeReviewBookmarks(users, reviews, options = {}) {
  const records = [];
  const data1 = { ...{}, ...{ user_id: users[0].id, review_id: reviews[2].id } };
  await ReviewBookmark.build(data1).validate();
  if (data1.user_id != null && !await User.findByPk(data1.user_id, options)) {
    throw new Error("Invalid reference: ReviewBookmark.user_id");
  }
  if (data1.review_id != null && !await Review.findByPk(data1.review_id, options)) {
    throw new Error("Invalid reference: ReviewBookmark.review_id");
  }
  const [record1] = await ReviewBookmark.findOrCreate({
    where: { user_id: users[0].id, review_id: reviews[2].id },
    defaults: {},
    ...options,
  });
  records.push(record1);

  const data2 = { ...{}, ...{ user_id: users[2].id, review_id: reviews[0].id } };
  await ReviewBookmark.build(data2).validate();
  if (data2.user_id != null && !await User.findByPk(data2.user_id, options)) {
    throw new Error("Invalid reference: ReviewBookmark.user_id");
  }
  if (data2.review_id != null && !await Review.findByPk(data2.review_id, options)) {
    throw new Error("Invalid reference: ReviewBookmark.review_id");
  }
  const [record2] = await ReviewBookmark.findOrCreate({
    where: { user_id: users[2].id, review_id: reviews[0].id },
    defaults: {},
    ...options,
  });
  records.push(record2);

  for (const record of records) {
    await record.validate();
    if (record.user_id != null && !await User.findByPk(record.user_id, options)) {
      throw new Error("Invalid reference: ReviewBookmark.user_id");
    }
    if (record.review_id != null && !await Review.findByPk(record.review_id, options)) {
      throw new Error("Invalid reference: ReviewBookmark.review_id");
    }
  }
  return records;
}
