import { CommentLike } from "../models/CommentLike.js";
import { User } from "../models/User.js";
import { Comment } from "../models/Comment.js";

/** Inicializa CommentLikes de ejemplo después de crear sus dependencias. */
export async function initializeCommentLikes(users, comments, options = {}) {
  const records = [];
  const data1 = { ...{}, ...{ user_id: users[0].id, comment_id: comments[0].id } };
  await CommentLike.build(data1).validate();
  if (data1.user_id != null && !await User.findByPk(data1.user_id, options)) {
    throw new Error("Invalid reference: CommentLike.user_id");
  }
  if (data1.comment_id != null && !await Comment.findByPk(data1.comment_id, options)) {
    throw new Error("Invalid reference: CommentLike.comment_id");
  }
  const [record1] = await CommentLike.findOrCreate({
    where: { user_id: users[0].id, comment_id: comments[0].id },
    defaults: {},
    ...options,
  });
  records.push(record1);

  const data2 = { ...{}, ...{ user_id: users[2].id, comment_id: comments[1].id } };
  await CommentLike.build(data2).validate();
  if (data2.user_id != null && !await User.findByPk(data2.user_id, options)) {
    throw new Error("Invalid reference: CommentLike.user_id");
  }
  if (data2.comment_id != null && !await Comment.findByPk(data2.comment_id, options)) {
    throw new Error("Invalid reference: CommentLike.comment_id");
  }
  const [record2] = await CommentLike.findOrCreate({
    where: { user_id: users[2].id, comment_id: comments[1].id },
    defaults: {},
    ...options,
  });
  records.push(record2);

  for (const record of records) {
    await record.validate();
    if (record.user_id != null && !await User.findByPk(record.user_id, options)) {
      throw new Error("Invalid reference: CommentLike.user_id");
    }
    if (record.comment_id != null && !await Comment.findByPk(record.comment_id, options)) {
      throw new Error("Invalid reference: CommentLike.comment_id");
    }
  }
  return records;
}
