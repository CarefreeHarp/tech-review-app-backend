import { Notification } from "../models/Notification.js";
import { User } from "../models/User.js";
import { Review } from "../models/Review.js";
import { Comment } from "../models/Comment.js";

/** Inicializa Notifications de ejemplo después de crear sus dependencias. */
export async function initializeNotifications(users, reviews, comments, options = {}) {
  const records = [];
  const data1 = { ...{ review_id: reviews[0].id, comment_id: null, is_read: false }, ...{ user_id: users[0].id, actor_user_id: users[1].id, type: "review_like" } };
  await Notification.build(data1).validate();
  if (data1.user_id != null && !await User.findByPk(data1.user_id, options)) {
    throw new Error("Invalid reference: Notification.user_id");
  }
  if (data1.actor_user_id != null && !await User.findByPk(data1.actor_user_id, options)) {
    throw new Error("Invalid reference: Notification.actor_user_id");
  }
  if (data1.review_id != null && !await Review.findByPk(data1.review_id, options)) {
    throw new Error("Invalid reference: Notification.review_id");
  }
  if (data1.comment_id != null && !await Comment.findByPk(data1.comment_id, options)) {
    throw new Error("Invalid reference: Notification.comment_id");
  }
  const review1 = data1.review_id == null ? null : await Review.findByPk(data1.review_id, options);
  const comment1 = data1.comment_id == null ? null : await Comment.findByPk(data1.comment_id, options);
  if (comment1 && comment1.review_id !== data1.review_id) {
    throw new Error("Notification comment and review do not match");
  }
  if (["review_like", "comment"].includes(data1.type) && (!review1 || review1.user_id !== data1.user_id)) {
    throw new Error("Notification must target the review author");
  }
  if (data1.type === "comment_like" && (!comment1 || comment1.user_id !== data1.user_id)) {
    throw new Error("Comment like notification must target the comment author");
  }
  if (data1.type === "follow" && (review1 || comment1 || data1.user_id === data1.actor_user_id)) {
    throw new Error("Invalid follow notification");
  }
  const [record1] = await Notification.findOrCreate({
    where: { user_id: users[0].id, actor_user_id: users[1].id, type: "review_like" },
    defaults: { review_id: reviews[0].id, comment_id: null, is_read: false },
    ...options,
  });
  records.push(record1);

  const data2 = { ...{ review_id: reviews[0].id, comment_id: comments[0].id, is_read: false }, ...{ user_id: users[1].id, actor_user_id: users[0].id, type: "comment_like" } };
  await Notification.build(data2).validate();
  if (data2.user_id != null && !await User.findByPk(data2.user_id, options)) {
    throw new Error("Invalid reference: Notification.user_id");
  }
  if (data2.actor_user_id != null && !await User.findByPk(data2.actor_user_id, options)) {
    throw new Error("Invalid reference: Notification.actor_user_id");
  }
  if (data2.review_id != null && !await Review.findByPk(data2.review_id, options)) {
    throw new Error("Invalid reference: Notification.review_id");
  }
  if (data2.comment_id != null && !await Comment.findByPk(data2.comment_id, options)) {
    throw new Error("Invalid reference: Notification.comment_id");
  }
  const review2 = data2.review_id == null ? null : await Review.findByPk(data2.review_id, options);
  const comment2 = data2.comment_id == null ? null : await Comment.findByPk(data2.comment_id, options);
  if (comment2 && comment2.review_id !== data2.review_id) {
    throw new Error("Notification comment and review do not match");
  }
  if (["review_like", "comment"].includes(data2.type) && (!review2 || review2.user_id !== data2.user_id)) {
    throw new Error("Notification must target the review author");
  }
  if (data2.type === "comment_like" && (!comment2 || comment2.user_id !== data2.user_id)) {
    throw new Error("Comment like notification must target the comment author");
  }
  if (data2.type === "follow" && (review2 || comment2 || data2.user_id === data2.actor_user_id)) {
    throw new Error("Invalid follow notification");
  }
  const [record2] = await Notification.findOrCreate({
    where: { user_id: users[1].id, actor_user_id: users[0].id, type: "comment_like" },
    defaults: { review_id: reviews[0].id, comment_id: comments[0].id, is_read: false },
    ...options,
  });
  records.push(record2);

  const data3 = { ...{ review_id: null, comment_id: null, is_read: false }, ...{ user_id: users[1].id, actor_user_id: users[0].id, type: "follow" } };
  await Notification.build(data3).validate();
  if (data3.user_id != null && !await User.findByPk(data3.user_id, options)) {
    throw new Error("Invalid reference: Notification.user_id");
  }
  if (data3.actor_user_id != null && !await User.findByPk(data3.actor_user_id, options)) {
    throw new Error("Invalid reference: Notification.actor_user_id");
  }
  if (data3.review_id != null && !await Review.findByPk(data3.review_id, options)) {
    throw new Error("Invalid reference: Notification.review_id");
  }
  if (data3.comment_id != null && !await Comment.findByPk(data3.comment_id, options)) {
    throw new Error("Invalid reference: Notification.comment_id");
  }
  const review3 = data3.review_id == null ? null : await Review.findByPk(data3.review_id, options);
  const comment3 = data3.comment_id == null ? null : await Comment.findByPk(data3.comment_id, options);
  if (comment3 && comment3.review_id !== data3.review_id) {
    throw new Error("Notification comment and review do not match");
  }
  if (["review_like", "comment"].includes(data3.type) && (!review3 || review3.user_id !== data3.user_id)) {
    throw new Error("Notification must target the review author");
  }
  if (data3.type === "comment_like" && (!comment3 || comment3.user_id !== data3.user_id)) {
    throw new Error("Comment like notification must target the comment author");
  }
  if (data3.type === "follow" && (review3 || comment3 || data3.user_id === data3.actor_user_id)) {
    throw new Error("Invalid follow notification");
  }
  const [record3] = await Notification.findOrCreate({
    where: { user_id: users[1].id, actor_user_id: users[0].id, type: "follow" },
    defaults: { review_id: null, comment_id: null, is_read: false },
    ...options,
  });
  records.push(record3);

  for (const record of records) {
    await record.validate();
    if (record.user_id != null && !await User.findByPk(record.user_id, options)) {
      throw new Error("Invalid reference: Notification.user_id");
    }
    if (record.actor_user_id != null && !await User.findByPk(record.actor_user_id, options)) {
      throw new Error("Invalid reference: Notification.actor_user_id");
    }
    if (record.review_id != null && !await Review.findByPk(record.review_id, options)) {
      throw new Error("Invalid reference: Notification.review_id");
    }
    if (record.comment_id != null && !await Comment.findByPk(record.comment_id, options)) {
      throw new Error("Invalid reference: Notification.comment_id");
    }
    const review = record.review_id == null ? null : await Review.findByPk(record.review_id, options);
    const comment = record.comment_id == null ? null : await Comment.findByPk(record.comment_id, options);
    if (comment && comment.review_id !== record.review_id) throw new Error("Notification comment and review do not match");
    if (["review_like", "comment"].includes(record.type) && (!review || review.user_id !== record.user_id)) throw new Error("Notification must target the review author");
    if (record.type === "comment_like" && (!comment || comment.user_id !== record.user_id)) throw new Error("Comment like notification must target the comment author");
    if (record.type === "follow" && (review || comment || record.user_id === record.actor_user_id)) throw new Error("Invalid follow notification");
  }
  return records;
}
