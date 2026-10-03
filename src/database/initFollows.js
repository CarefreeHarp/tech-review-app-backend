import { Follow } from "../models/Follow.js";
import { User } from "../models/User.js";

/** Inicializa Follows de ejemplo después de crear sus dependencias. */
export async function initializeFollows(users, options = {}) {
  const records = [];
  const data1 = { ...{}, ...{ follower_id: users[0].id, followed_id: users[1].id } };
  await Follow.build(data1).validate();
  if (data1.follower_id != null && !await User.findByPk(data1.follower_id, options)) {
    throw new Error("Invalid reference: Follow.follower_id");
  }
  if (data1.followed_id != null && !await User.findByPk(data1.followed_id, options)) {
    throw new Error("Invalid reference: Follow.followed_id");
  }
  if (data1.follower_id === data1.followed_id) {
    throw new Error("A user cannot follow themselves");
  }
  const [record1] = await Follow.findOrCreate({
    where: { follower_id: users[0].id, followed_id: users[1].id },
    defaults: {},
    ...options,
  });
  records.push(record1);

  const data2 = { ...{}, ...{ follower_id: users[1].id, followed_id: users[2].id } };
  await Follow.build(data2).validate();
  if (data2.follower_id != null && !await User.findByPk(data2.follower_id, options)) {
    throw new Error("Invalid reference: Follow.follower_id");
  }
  if (data2.followed_id != null && !await User.findByPk(data2.followed_id, options)) {
    throw new Error("Invalid reference: Follow.followed_id");
  }
  if (data2.follower_id === data2.followed_id) {
    throw new Error("A user cannot follow themselves");
  }
  const [record2] = await Follow.findOrCreate({
    where: { follower_id: users[1].id, followed_id: users[2].id },
    defaults: {},
    ...options,
  });
  records.push(record2);

  for (const record of records) {
    await record.validate();
    if (record.follower_id != null && !await User.findByPk(record.follower_id, options)) {
      throw new Error("Invalid reference: Follow.follower_id");
    }
    if (record.followed_id != null && !await User.findByPk(record.followed_id, options)) {
      throw new Error("Invalid reference: Follow.followed_id");
    }
    if (record.follower_id === record.followed_id) throw new Error("A user cannot follow themselves");
  }
  return records;
}
