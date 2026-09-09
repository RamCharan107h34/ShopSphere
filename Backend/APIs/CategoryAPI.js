import exp from "express";

import { CategoryModel } from "../models/CategoryModel.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import { verifyRole } from "../middlewares/verifyRole.js";

export const categoryApp = exp.Router();

// 1. Get All Active Categories (Public)
categoryApp.get("/categories", async (req, res) => {
    const categories = await CategoryModel.find({ isActive: true })
        .populate("parentCategory", "name slug")
        .sort({ name: 1 });

    res.status(200).json({
        message: "Categories list",
        payload: categories
    });
});

// 2. Get Category By ID (Public)
categoryApp.get("/categories/:id", async (req, res) => {
    const category = await CategoryModel.findById(req.params.id)
        .populate("parentCategory", "name slug");

    if (!category) {
        return res.status(404).json({
            message: "Category not found"
        });
    }

    res.status(200).json({
        message: "Category details",
        payload: category
    });
});

// 2b. Get All Categories Including Inactive (Admin only)
categoryApp.get("/admin/categories", verifyToken, verifyRole("admin"), async (req, res) => {
    const categories = await CategoryModel.find()
        .populate("parentCategory", "name slug")
        .sort({ name: 1 });

    res.status(200).json({
        message: "All categories list",
        payload: categories
    });
});

// 3. Create Category (Admin only)
categoryApp.post("/categories", verifyToken, verifyRole("admin"), async (req, res) => {
    const { name, slug, description, image, parentCategory } = req.body;

    if (!name) {
        return res.status(400).json({
            message: "Category name is required"
        });
    }

    // "Audio & Headphones" -> "audio-headphones" (lowercase, non-alphanumerics become "-")
    const generatedSlug = slug
        ? slug.trim().toLowerCase()
        : name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

    const categoryDoc = new CategoryModel({
        name: name.trim(),
        slug: generatedSlug,
        description: description || "",
        image: image || "",
        parentCategory: parentCategory || null
    });

    const savedCategory = await categoryDoc.save();

    res.status(201).json({
        message: "Category created successfully",
        payload: savedCategory
    });
});

// 4. Update Category (Admin only)
categoryApp.put("/categories/:id", verifyToken, verifyRole("admin"), async (req, res) => {
    const modifiedCategory = req.body;

    if (modifiedCategory.name && !modifiedCategory.slug) {
        modifiedCategory.slug = modifiedCategory.name
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");
    }

    const updatedCategory = await CategoryModel.findByIdAndUpdate(
        req.params.id,
        { $set: { ...modifiedCategory } },
        { returnDocument: "after" }
    );

    if (!updatedCategory) {
        return res.status(404).json({
            message: "Category not found"
        });
    }

    res.status(200).json({
        message: "Category updated successfully",
        payload: updatedCategory
    });
});

// 5. Delete Category (Admin only)
categoryApp.delete("/categories/:id", verifyToken, verifyRole("admin"), async (req, res) => {
    const deletedCategory = await CategoryModel.findByIdAndDelete(req.params.id);

    if (!deletedCategory) {
        return res.status(404).json({
            message: "Category not found"
        });
    }

    res.status(200).json({
        message: "Category deleted successfully",
        payload: deletedCategory
    });
});
