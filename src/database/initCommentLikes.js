import { CommentLike } from "../models/CommentLike.js";
import { User } from "../models/User.js";
import { Comment } from "../models/Comment.js";

/** Inicializa likes para todos los comentarios y respuestas; unos pocos reciben dos. */
export async function initializeCommentLikes(users, comments, options = {}) {
  const records = [];
  for (const [index, comment] of comments.entries()) {
    const otherUsers = users.filter((user) => user.id !== comment.user_id);
    if (otherUsers.length === 0) throw new Error("Comment likes require another user");
    const firstUserIndex = index % otherUsers.length;
    const likers = [otherUsers[firstUserIndex]];
    // Uno de cada seis comentarios recibe una segunda reacción de un usuario distinto.
    if (index % 6 === 0 && otherUsers.length > 1) {
      likers.push(otherUsers[(firstUserIndex + 1) % otherUsers.length]);
    }
    for (const user of likers) {
      const data = { user_id: user.id, comment_id: comment.id };
      await CommentLike.build(data).validate();
      if (!await User.findByPk(user.id, options)) throw new Error("Invalid reference: CommentLike.user_id");
      if (!await Comment.findByPk(comment.id, options)) throw new Error("Invalid reference: CommentLike.comment_id");
      const [record] = await CommentLike.findOrCreate({ where: data, defaults: {}, ...options });
      records.push(record);
    }
  }

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
