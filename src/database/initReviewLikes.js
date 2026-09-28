import { Review } from "../models/Review.js";
import { ReviewLike } from "../models/ReviewLike.js";
import { User } from "../models/User.js";

const initialReviewLikes = [
  { userIndex: 1, reviewIndex: 0 },
  { userIndex: 0, reviewIndex: 1 },
];

export async function initializeReviewLikes() {
  try {
    const count = await ReviewLike.count();
    if (count === 0) {
      const users = await User.findAll({ order: [["id", "ASC"]], limit: 2 });
      const reviews = await Review.findAll({ order: [["id", "ASC"]], limit: 2 });
      if (users.length === 0 || reviews.length === 0) {
        throw new Error("Users and reviews are required to initialize review likes");
      }

      const reviewLikes = initialReviewLikes.map(({ userIndex, reviewIndex }) => ({
        user_id: users[userIndex % users.length].id,
        review_id: reviews[reviewIndex % reviews.length].id,
      }));

      await ReviewLike.bulkCreate(reviewLikes);
      console.log("Initial review likes loaded");
    }
  } catch (error) {
    console.error("Error initializing review likes:", error);
    throw error;
  }
}
