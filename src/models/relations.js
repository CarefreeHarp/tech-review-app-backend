import { User } from "./User.js";
import { Article } from "./Article.js";
import { Review } from "./Review.js";
import { ReviewLike } from "./ReviewLike.js";


export function setupRelations() {


    // USER - REVIEW es una relacion 1:N
    User.hasMany(Review, {
        foreignKey: "user_id",
        as: "reviews",
        onDelete: "CASCADE"
    });

    Review.belongsTo(User, {
        foreignKey: "user_id",
        as: "user"
    });


    // ARTICLE - REVIEW es una relacion 1:N
    Article.hasMany(Review, {
        foreignKey: "article_id",
        as: "reviews",
        onDelete: "CASCADE"
    });

    Review.belongsTo(Article, {
        foreignKey: "article_id",
        as: "article"
    });


    // USER - REVIEWLIKE es una relacion 1:N
    User.hasMany(ReviewLike, {
        foreignKey: "user_id",
        as: "reviewLikes",
        onDelete: "CASCADE"
    });

    ReviewLike.belongsTo(User, {
        foreignKey: "user_id",
        as: "user"
    });


    // REVIEW - REVIEWLIKE es una relacion 1:N
    Review.hasMany(ReviewLike, {
        foreignKey: "review_id",
        as: "likes",
        onDelete: "CASCADE"
    });

    ReviewLike.belongsTo(Review, {
        foreignKey: "review_id",
        as: "review"
    });

}