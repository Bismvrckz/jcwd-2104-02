const express = require('express');
const router = express.Router();
const { uploadProductImage } = require('../../lib/multer');
const { auth } = require('../../helpers/auth');
const { QueryTypes } = require('sequelize');
const {
  products,
  sequelize,
  categories,
  categories_list,
  product_details,
  Sequelize,
} = require('../../../models');

const getProductDetail = async (req, res, next) => {
  try {
    const { product_id } = req.params;

    const resProductDetail = await products.findOne({
      where: {
        product_id,
      },
    });

    res.send({
      status: 'Success',
      message: 'Success get product detail',
      data: resProductDetail,
    });
  } catch (error) {
    next(error);
  }
};

const landingPageProducts = async (req, res, next) => {
  try {
    const { limit, productsPage } = req.query;

    const landingPageProducts = await products.findAll({
      offset: parseInt(productsPage - 1) * parseInt(limit),
      limit: parseInt(limit),
    });

    const hasMore = (
      await products.findAll({
        offset: parseInt(productsPage) * parseInt(limit),
        limit: parseInt(limit),
      })
    ).length;

    res.send({
      status: 'success',
      landingPageProducts,
      hasMore,
    });
  } catch (error) {
    next(error);
  }
};

async function getAllProducts(req, res, next) {
  try {
    const resGetAllProducts = await products.findAll({
      order: [['productName', 'ASC']],
    });
    res.send({
      status: 'success',
      message: 'get products success',
      data: {
        resGetAllProducts,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function getAllProductsController(req, res, next) {
  try {
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);

    const resGetAllProducts = await products.findAll({
      where: { isPublic: true },
      offset: (page - 1) * limit,
      limit,
    });

    const resGetNextPage = await products.findAll({
      offset: page * limit,
      limit,
    });

    let hasMore = true;

    if (!resGetNextPage.length) {
      hasMore = false;
    }

    for (let product of resGetAllProducts) {
      const resGetEachCategory = await categories.findOne({
        where: { product_id: product.product_id },
      });

      const resGetProductDefaultQuantity = await product_details.findOne({
        where: { product_id: product.product_id },
      });

      const resGetCategoriesLists = resGetEachCategory
        ? await categories_list.findOne({
            where: {
              category_lists_id:
                resGetEachCategory?.dataValues.category_lists_id,
            },
          })
        : '';

      product.dataValues.category_lists_id =
        resGetCategoriesLists?.dataValues?.category_lists_id;

      product.dataValues.category = resGetEachCategory?.dataValues.categoryName;

      product.dataValues.category_id =
        resGetEachCategory?.dataValues.category_id;
    }

    res.send({
      hasMore,
      status: 'success',
      products: resGetAllProducts,
    });
  } catch (error) {
    next(error);
  }
}

async function getAllProductsSortedController(req, res, next) {
  try {
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);

    const { sortOrder } = req.params;

    const splitOrder = sortOrder.split('=');

    const resGetAllProducts = await products.findAll({
      order: [[splitOrder[1], splitOrder[2]]],
      offset: (page - 1) * limit,
      limit,
    });

    const resGetNextPage = await products.findAll({
      order: [[splitOrder[1], splitOrder[2]]],
      offset: page * limit,
      limit,
    });

    let hasMore = true;

    if (!resGetNextPage.length) {
      hasMore = false;
    }

    for (let product of resGetAllProducts) {
      const resGetEachCategory = await categories.findOne({
        where: { product_id: product.product_id },
      });

      const resGetCategoriesLists = resGetEachCategory
        ? await categories_list.findOne({
            where: {
              category_lists_id:
                resGetEachCategory?.dataValues.category_lists_id,
            },
          })
        : '';

      const resGetProductDefaultQuantity = await product_details.findOne({
        where: { product_id: product.product_id },
      });

      product.dataValues.category = resGetEachCategory?.dataValues.categoryName;

      product.dataValues.category_lists_id =
        resGetCategoriesLists?.dataValues?.category_lists_id;

      product.dataValues.category_id =
        resGetEachCategory?.dataValues.category_id;
    }

    res.send({
      hasMore,
      status: 'success',
      products: resGetAllProducts,
    });
  } catch (error) {
    next(error);
  }
}

async function getSpecificProductsController(req, res, next) {
  try {
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);
    const { specifics } = req.params;

    const resGetCategories = await categories.findAll({
      where: { categoryName: specifics },
      offset: (page - 1) * limit,
      limit,
    });

    const resCheckCategories = await categories_list.findAll({
      where: { category: specifics },
    });

    const resGetByKeyword = await sequelize.query(
      `SELECT * FROM medbox.products WHERE productName LIKE '%${specifics}%' LIMIT ${
        (page - 1) * limit
      },${limit};`,
      { type: QueryTypes.SELECT },
    );

    const resGetByKeywordNext = await sequelize.query(
      `SELECT * FROM medbox.products WHERE productName LIKE '%${specifics}%' LIMIT ${
        page * limit
      },${limit};`,
      { type: QueryTypes.SELECT },
    );

    let hasMore = true;

    if (!resGetByKeywordNext.length) {
      hasMore = false;
    }

    for (let product of resGetByKeyword) {
      const resGetEachCategory = await categories.findOne({
        where: { product_id: product.product_id },
      });

      const resGetCategoriesLists = resGetEachCategory
        ? await categories_list.findOne({
            where: {
              category_lists_id:
                resGetEachCategory?.dataValues.category_lists_id,
            },
          })
        : '';

      product.category_lists_id =
        resGetCategoriesLists?.dataValues?.category_lists_id;

      product.category = resGetEachCategory?.dataValues.categoryName;

      product.category_id = resGetEachCategory?.dataValues.category_id;
    }

    res.send({
      status: 'success',
      products: resGetByKeyword,
      hasMore,
    });
  } catch (error) {
    next(error);
  }
}

async function getProductsByCategoryController(req, res, next) {
  try {
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);
    const { categoryListId } = req.params;
    const destroy = await categories.destroy({ where: { product_id: null } });

    const resGetCategories = await categories.findAll({
      where: { category_lists_id: categoryListId },
      offset: (page - 1) * limit,
      limit,
    });

    const resGetNextPage = await categories.findAll({
      where: { category_lists_id: categoryListId },
      offset: page * limit,
      limit,
    });

    let hasMore = true;

    if (!resGetNextPage.length) {
      hasMore = false;
    }

    const productsIdMap = resGetCategories.map((category) => {
      return category.dataValues.product_id;
    });

    let finalProducts = [];

    let resGetProducts;

    for (let product_id of productsIdMap) {
      resGetProducts = await products.findOne({ where: { product_id } });
      finalProducts.push(resGetProducts.dataValues);
    }

    for (let product of finalProducts) {
      const resGetEachCategory = await categories.findOne({
        where: { product_id: product.product_id },
      });

      const resGetProductDefaultQuantity = await product_details.findOne({
        where: { product_id: product.product_id },
      });

      const resGetCategoriesLists = resGetEachCategory
        ? await categories_list.findOne({
            where: {
              category_lists_id:
                resGetEachCategory?.dataValues.category_lists_id,
            },
          })
        : '';

      product.category = resGetEachCategory?.dataValues.categoryName;

      product.category_lists_id =
        resGetCategoriesLists?.dataValues?.category_lists_id;

      product.category_id = resGetEachCategory?.dataValues.category_id;
    }

    res.send({
      status: 'success',
      products: finalProducts,
      hasMore,
    });
  } catch (error) {
    next(error);
  }
}

router.get('/byId/:product_id', auth, getProductDetail);
router.get('/landingPage', landingPageProducts);
router.get('/specifics/:specifics', getSpecificProductsController);
router.get('/sort/:sortOrder', getAllProductsSortedController);
router.get('/byCategory/:categoryListId', getProductsByCategoryController);
router.get('/all', getAllProductsController);
router.get('/', getAllProducts);
module.exports = router;
