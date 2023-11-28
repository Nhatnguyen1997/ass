const { render } = require('ejs')
const express = require('express')
const app = express()
app.use(express.static('public'));
app.use('/Image', express.static('./Image'));
const port = 3000
const bodyParser = require("body-parser");
app.use(bodyParser.json()) // cho phép đọc dữ liệu truyền từ api vào form
app.set('view engine', 'ejs')
const User = require("./models/UserModel")
const Product = require("./models/ProductModel")
const mongoose = require('mongoose')
const path = require('path');
const multer = require('multer');
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'Image/')
    },
    filename: (req, file, cb) => {
        console.log(file)
        cb(null, Date.now() + path.extname(file.originalname))
    }
})
const uploadImage = multer({ storage: storage });
mongoose.connect("mongodb://127.0.0.1:27017/ass", {
    useNewUrlParser: true, useUnifiedTopology: true
})
    .then(() => {
        console.log('Kết nối tới MongoDB thành công.');
    })
    .catch((err) => {
        console.error('Lỗi khi kết nối tới MongoDB: ' + err);
    });

app.get('/home', (req, res) => {
    const relativePath = 'Screen/Home';
    res.render(relativePath);
})
app.get('/signin', (req, res) => {
    const relativePath = 'Screen/SignIn';
    res.render(relativePath);
})
app.get('/signup', (req, res) => {
    const relativePath = 'Screen/SignUp';
    res.render(relativePath);
})

app.get('/listcustomers', (req, res) => {
    const relativePath = 'Screen/ListCustomer';
    res.render(relativePath);
})
app.get('/insertproduct', (req, res) => {
    const relativePath = 'Screen/InsertProduct';
    res.render(relativePath);
})
app.get('/insertcustomer', (req, res) => {
    const relativePath = 'Screen/InsertCustomer';
    res.render(relativePath);
})
app.get('/editproduct/:id', async (req, res) => {
    const productId = req.params.id;
    try {
        const product = await Product.findById(productId)
        const relativePath = 'Screen/EditProduct';
        res.render(relativePath, { product });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }

});
app.post("/signup/User", async (req, res) => {
    const emailcheck = req.body.email
    const existingUser = await User.findOne({ email: emailcheck });
    if (existingUser) {
        res.status(400).json({ message: "Your registered account already exists" });
    }
    else {
        const newUser = new User({
            email: req.body.email,
            password: req.body.password
        });
        try {
            const result = await newUser.save();
            res.json(result)
        } catch (error) {
            console.log(error)
        }
    }

})
app.post("/signin", async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;


    const user = await User.findOne({ email: email, password: password });

    if (user) {

        res.send('Đăng nhập thành công');
    } else {

        res.status(400).json({ message: "Wrong account or password" });
    }
});
app.post("/insertProduct/Product", uploadImage.single('image'), async (req, res) => {
    const namecheck = req.body.name;

    try {

        const existingProduct = await Product.findOne({ name: namecheck });
        if (existingProduct) {
            return res.status(400).json({ message: "Product already exists" });
        }


        const { name, price, color, type } = req.body;
        const imagePath = req.file.filename;


        const newProduct = new Product({
            name,
            price,
            color,
            type,
            image: imagePath,
        });


        const result = await newProduct.save();

        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
app.get('/listproducts', async (req, res) => {
    try {
        const products = await Product.find();
        res.render("Screen/ListProduct", { products });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});
app.post('/searchProductByName', async (req, res) => {
    try {
        const { name } = req.body;

        const products = await Product.find({ name: { $regex: new RegExp(name, 'i') } });

        res.json(products);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});
app.delete('/deleteProduct/:id', async (req, res) => {
    const productId = req.params.id;
    console.log("id can xoa" + productId)

    try {

        const result = await Product.findByIdAndDelete(productId);

        if (result) {

            res.json({ message: `Product with id ${productId} deleted successfully.` });
        } else {

            res.status(404).json({ error: `Product with id ${productId} not found.` });
        }
    } catch (error) {

        console.error('Error deleting product:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }

});
app.put('/editProduct/Product/:id', uploadImage.single('image'), async (req, res) => {

    try {
        const { name, price, color, type } = req.body;
        const image = req.file.filename;

        const updatedProduct = await Product.findOneAndUpdate(
            { _id: req.params.id },
            { $set: { name, price, color, type, image } },
            { new: true }
        );

        if (!updatedProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.status(200).json(updatedProduct);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});


// thiết lập cổng cho server
app.listen(port, () => {
    console.log(`server running at the port ${port}`)
})