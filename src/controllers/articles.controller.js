import { Article } from "../models/Article.js";
import { Review } from "../models/Review.js";
import { User } from "../models/User.js";


export const getArticles = async(req,res)=>{

    try{

        const articles = await Article.findAll({

            include:[
                {
                    model:Review,
                    as:"reviews",
                    include:[
                        {
                            model:User,
                            as:"user"
                        }
                    ]
                }
            ]
        });

        res.json(articles);

    }catch(error){
        res.status(500).json({
            message:error.message
        });
    }
};

export const getArticleById = async(req,res)=>{

    try{

        const {id}=req.params;
        const article = await Article.findByPk(id,{

            include:[
                {
                    model:Review,
                    as:"reviews",
                    include:[
                        {
                            model:User,
                            as:"user"
                        }
                    ]
                }
            ]
        });

        if(!article){
            return res.status(404).json({
                message:"Article not found"
            });
        }

        res.json(article);

    }catch(error){
        res.status(500).json({
            message:error.message
        });
    }
};