import { NextResponse } from "next/server";
import Items from "@/models/additems";
import { connectDB } from "@/lib/database";

//add items
export async function POST(req: Request) {
    try {
        const { name, description, price, imageUrl } = await req.json();
        await connectDB();
        const item = new Items({ name, description, price, imageUrl });
        await item.save();
        return NextResponse.json({ message: "Item added successfully" }, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: "Item not added" }, { status: 500 });
    }
}


//get all items
export async function GET() {
    try {
        await connectDB();
        const items = await Items.find();
        return NextResponse.json(items, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: "Items not found" }, { status: 500 });
    }

}


//update items
export async function PUT(req: Request) {
    try {
        const { _id, name, description, price, imageUrl } = await req.json();
        await connectDB();
        const item = _id 
            ? await Items.findByIdAndUpdate(_id, { name, description, price, imageUrl }, { new: true })
            : await Items.findOneAndUpdate({ name }, { description, price, imageUrl }, { new: true });
        return NextResponse.json({ message: "Item updated successfully" }, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: "Item not updated" }, { status: 500 });
    }
}

//delete items
export async function DELETE(req: Request) {
    try {
        const { id, _id } = await req.json();
        await connectDB();
        const targetId = _id || id;
        const item = await Items.findByIdAndDelete(targetId);
        return NextResponse.json({ message: "Item deleted successfully" }, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: "Item not deleted" }, { status: 500 });
    }
}       