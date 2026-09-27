import { Review } from "../models/Review.js";
import { User } from "../models/User.js";
import { Article } from "../models/Article.js";

export const createReview = async(req,res)=>{

    try{

        const review = await Review.create(req.body);
        const newReview = await Review.findByPk(review.id,{
            include:[
                {
                    model:User,
                    as:"user"
                },
                {
                    model:Article,
                    as:"article"
                }
            ]
        });

        res.status(201).json(newReview);

    }catch(error){
        res.status(500).json({
            message:error.message
        });
    }
};

export const getReviewsByArticle = async(req,res)=>{

    try{

        const {id}=req.params;
        const reviews = await Review.findAll({
            where:{
                article_id:id
            },
            include:[
                {
                    model:User,
                    as:"user"
                },
                {
                    model:Article,
                    as:"article"
                }
            ]
        });

        res.json(reviews);

    }catch(error){
        res.status(500).json({
            message:error.message
        });
    }
};

export const getReviewsByUser = async(req,res)=>{

    try{

        const {id}=req.params;
        const reviews = await Review.findAll({
            where:{
                user_id:id
            },
            include:[
                {
                    model:Article,
                    as:"article"
                }
            ]
        });

        res.json(reviews);

    }catch(error){
        res.status(500).json({
            message:error.message
        });
    }
};

export const deleteReview = async(req,res)=>{

    try{
        const {id}=req.params;
        const deleted = await Review.destroy({
            where:{
                id
            }
        });

        if(!deleted){
            return res.status(404).json({
                message:"Review not found"
            });
        }

        res.json({
            message:"Review deleted"
        });

    }catch(error){
        res.status(500).json({
            message:error.message
        });
    }
};

export const updateReview = async(req,res)=>{

    try{

        const {id}=req.params;
        const [updated] = await Review.update(
            req.body,
            {
                where:{
                    id
                }
            }
        );

        if(!updated){
            return res.status(404).json({
                message:"Review not found"
            });
        }

        const review = await Review.findByPk(id,{
            include:[
                {
                    model:User,
                    as:"user"
                },
                {
                    model:Article,
                    as:"article"
                }
            ]
        });

        res.json(review);

    }catch(error){
        res.status(500).json({
            message:error.message
        });
    }
};