import { User } from "../models/User.js";
import { Review } from "../models/Review.js";
import { Article } from "../models/Article.js";


export const getUserById = async (req, res) => {

    try {

        const { id } = req.params;
        const user = await User.findByPk(id, {

            include: [
                {
                    model: Review,
                    as: "reviews",
                    include: [
                        {
                            model: Article,
                            as: "article"
                        }
                    ]
                }
            ]
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        res.json(user);

    } catch(error) {
        res.status(500).json({
            message: error.message
        });
    }
};