import { timeStamp } from "console";
import mongoose, { Schema, Document, Model } from "mongoose";


export interface Items extends Document {
    name: string;
    description: string;
    price: string;
    imageUrl: string[];
}

const ItemShema = new Schema<Items>(
    {
        name: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        price: {
            type: String,
            required: true,
        },
        imageUrl: [{
            type: String,
            default: []
        }]
    }, {
    timestamps: true
}
);

const Items: Model<Items> = mongoose.models.Items || mongoose.model<Items>("Items", ItemShema);
export default Items;
