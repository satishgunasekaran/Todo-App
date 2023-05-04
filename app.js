const express = require('express');
const bodyParser = require('body-parser');
const date = require(__dirname + '/date.js');
const dotenv = require("dotenv")
dotenv.config()



// DB
const mongoose = require('mongoose')
const _ = require('lodash')


const app = express();


app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


// Database Stuff

mongoose.connect(`mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.yhxrpb3.mongodb.net/?retryWrites=true&w=majority`, {useNewUrlParser : true})

const itemSchema = {
    name: String
};

const Item =  mongoose.model(
    "Item",
    itemSchema
)


const item1 = new Item({
  name : "Welcome to your ToDo List!"
})


const item2 = new Item({
  name : "Hit the + button to add a new item."
})

const item3 = new Item({
  name : "<-- Hit this to delete an item."
})

const defaultItems = [item1, item2, item3]


const listSchema = {
  name : String,
  items : [itemSchema]
}

const List = mongoose.model("List", listSchema)


// End of DataBase Stuff


app.get("/",async function(req, res) {
  const day = date.getDate();
  foundItems =  await Item.find({})
  // console.log(foundItems);

  if (foundItems.length === 0) {
    Item.insertMany(defaultItems)
    res.redirect("/")
  }

  res.render("list", {
    listTitle: "Today",
    listItems: foundItems,
    date: day
  });
});

app.post("/", function(req, res){
  const itemName = req.body.newItem;
  const item = new Item({
    name : itemName
  });
  item.save();
  res.redirect("/")
});

app.post("/delete",async function (req,res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today"){
    await Item.findByIdAndRemove(checkedItemId);
    res.redirect("/")
  }else{
    await List.findOneAndUpdate({name : listName},
                                  {$pull: 
                                    {items: {_id : checkedItemId}}
                                  })
    res.redirect("/"+listName)
  }

  
  
});




app.get("/:customListName",async function(req, res){
  const customListName = _.capitalize(req.params.customListName);

  let qres = await List.findOne({name : customListName})
  if (qres){
    res.render("list", {
      listTitle: customListName,
      listItems: qres.items
    });
  }else{
    const list = new List({
      name : customListName,
      items: defaultItems 
    });
    list.save();
    res.redirect("/"+customListName)
  }
});

app.post("/:customListName",async function(req, res){
  const customListName = req.params.customListName;
  const itemName = req.body.newItem;
  const item = new Item({
    name : itemName
  });

  let lst = await List.findOne({name : customListName})
  await lst.items.push(item)
  lst.save()

  res.redirect("/"+customListName)
});




app.listen(3000, function() {
  console.log("Server running on port 3000.");
});