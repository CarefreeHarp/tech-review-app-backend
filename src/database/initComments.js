import { Comment } from "../models/Comment.js";
import { Review } from "../models/Review.js";
import { User } from "../models/User.js";

/** Inicializa Comments de ejemplo después de crear sus dependencias. */
export async function initializeComments(users, reviews, options = {}) {
  const records = [];
  const data1 = { ...{ parent_comment_id: null, is_active: true }, ...{ review_id: reviews[0].id, user_id: users[1].id, body: "¿Son cómodos para usarlos varias horas?" } };
  await Comment.build(data1).validate();
  if (data1.review_id != null && !await Review.findByPk(data1.review_id, options)) {
    throw new Error("Invalid reference: Comment.review_id");
  }
  if (data1.user_id != null && !await User.findByPk(data1.user_id, options)) {
    throw new Error("Invalid reference: Comment.user_id");
  }
  if (data1.parent_comment_id != null && !await Comment.findByPk(data1.parent_comment_id, options)) {
    throw new Error("Invalid reference: Comment.parent_comment_id");
  }
  if (data1.parent_comment_id != null) {
    const parent = await Comment.findByPk(data1.parent_comment_id, options);
    if (parent.review_id !== data1.review_id) {
      throw new Error("A reply must belong to its parent's review");
    }
  }
  const [record1] = await Comment.findOrCreate({
    where: { review_id: reviews[0].id, user_id: users[1].id, body: "¿Son cómodos para usarlos varias horas?" },
    defaults: { parent_comment_id: null, is_active: true },
    ...options,
  });
  records.push(record1);

  const data2 = { ...{ parent_comment_id: records[0].id, is_active: true }, ...{ review_id: reviews[0].id, user_id: users[0].id, body: "Sí, los uso durante toda la jornada." } };
  await Comment.build(data2).validate();
  if (data2.review_id != null && !await Review.findByPk(data2.review_id, options)) {
    throw new Error("Invalid reference: Comment.review_id");
  }
  if (data2.user_id != null && !await User.findByPk(data2.user_id, options)) {
    throw new Error("Invalid reference: Comment.user_id");
  }
  if (data2.parent_comment_id != null && !await Comment.findByPk(data2.parent_comment_id, options)) {
    throw new Error("Invalid reference: Comment.parent_comment_id");
  }
  if (data2.parent_comment_id != null) {
    const parent = await Comment.findByPk(data2.parent_comment_id, options);
    if (parent.review_id !== data2.review_id) {
      throw new Error("A reply must belong to its parent's review");
    }
  }
  const [record2] = await Comment.findOrCreate({
    where: { review_id: reviews[0].id, user_id: users[0].id, body: "Sí, los uso durante toda la jornada." },
    defaults: { parent_comment_id: records[0].id, is_active: true },
    ...options,
  });
  records.push(record2);

  const data3 = { ...{ parent_comment_id: null, is_active: true }, ...{ review_id: reviews[2].id, user_id: users[2].id, body: "Gracias por compartir tu experiencia." } };
  await Comment.build(data3).validate();
  if (data3.review_id != null && !await Review.findByPk(data3.review_id, options)) {
    throw new Error("Invalid reference: Comment.review_id");
  }
  if (data3.user_id != null && !await User.findByPk(data3.user_id, options)) {
    throw new Error("Invalid reference: Comment.user_id");
  }
  if (data3.parent_comment_id != null && !await Comment.findByPk(data3.parent_comment_id, options)) {
    throw new Error("Invalid reference: Comment.parent_comment_id");
  }
  if (data3.parent_comment_id != null) {
    const parent = await Comment.findByPk(data3.parent_comment_id, options);
    if (parent.review_id !== data3.review_id) {
      throw new Error("A reply must belong to its parent's review");
    }
  }
  const [record3] = await Comment.findOrCreate({
    where: { review_id: reviews[2].id, user_id: users[2].id, body: "Gracias por compartir tu experiencia." },
    defaults: { parent_comment_id: null, is_active: true },
    ...options,
  });
  records.push(record3);

  const data4 = { ...{ parent_comment_id: records[2].id, is_active: true }, ...{ review_id: reviews[2].id, user_id: users[1].id, body: "Me alegra que te haya servido." } };
  await Comment.build(data4).validate();
  if (data4.review_id != null && !await Review.findByPk(data4.review_id, options)) {
    throw new Error("Invalid reference: Comment.review_id");
  }
  if (data4.user_id != null && !await User.findByPk(data4.user_id, options)) {
    throw new Error("Invalid reference: Comment.user_id");
  }
  if (data4.parent_comment_id != null && !await Comment.findByPk(data4.parent_comment_id, options)) {
    throw new Error("Invalid reference: Comment.parent_comment_id");
  }
  if (data4.parent_comment_id != null) {
    const parent = await Comment.findByPk(data4.parent_comment_id, options);
    if (parent.review_id !== data4.review_id) {
      throw new Error("A reply must belong to its parent's review");
    }
  }
  const [record4] = await Comment.findOrCreate({
    where: { review_id: reviews[2].id, user_id: users[1].id, body: "Me alegra que te haya servido." },
    defaults: { parent_comment_id: records[2].id, is_active: true },
    ...options,
  });
  records.push(record4);

  for (const record of records) {
    await record.validate();
    if (record.review_id != null && !await Review.findByPk(record.review_id, options)) {
      throw new Error("Invalid reference: Comment.review_id");
    }
    if (record.user_id != null && !await User.findByPk(record.user_id, options)) {
      throw new Error("Invalid reference: Comment.user_id");
    }
    if (record.parent_comment_id != null && !await Comment.findByPk(record.parent_comment_id, options)) {
      throw new Error("Invalid reference: Comment.parent_comment_id");
    }
    if (record.parent_comment_id != null) {
      const parent = await Comment.findByPk(record.parent_comment_id, options);
      if (parent.review_id !== record.review_id || parent.id === record.id) {
        throw new Error("A reply must belong to its parent's review and cannot reply to itself");
      }
    }
  }
  return records;
}
