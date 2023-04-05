const express = require ("express"); 
const bodyParser = require ("body-parser"); 
const mongoose = require ("mongoose"); 
const _ = require("lodash");
const app = express (); 
require('dotenv').config()
 
app.set ("view engine", "ejs"); 
app.use(bodyParser.urlencoded({extended: true})); 
app.use(express.static("public")); 
mongoose.set('strictQuery', true);
 
mongoose.connect("process.env.MONGO_URI" , {useNewUrlParser: true});
 
const itemsSchema = {
  name: String
}; 
 
const Item = mongoose.model("item", itemsSchema); 
 
const item1 = new Item ({
  name: "Welcome to your to do list!"
}); 
 
const item2 = new Item ({
  name: "Hit the + button to add a new item."
}); 
 
const item3 = new Item ({
  name: "<- Hit this to delete an item."  
}); 
 
const defaultItems = [item1, item2, item3]; 

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res){
  Item.find().then(function(foundItems){
      if (foundItems.length === 0) {
        Item.insertMany(defaultItems).then(function(){
          console.log("Succesfully saved all the items to todolistDB");
        })
        .catch(function (err) {
          console.log(err);
        });
        res.redirect("/");
      } else {
        res.render("list", {listTitle: "Today", newListItems: foundItems});
      }
  });
});

app.get("/:customListName", function(req,res){

  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName})

  .then(function(foundList){

    if (foundList === null){

      const list = new List({
        name: customListName,
        items: defaultItems
      });

      list.save();

      res.redirect("/"+ customListName);
      } else{

      res.render("list", {listTitle: foundList.name, newListItems: foundList.items});

    }
  })

  .catch(function (e){
    console.log(e);
  })

});
 
app.post("/", function (req,res){
 
  const ItemName = req.body.newItem; 
  const listName = req.body.list;
 
  const item = new Item({
    name: ItemName
  });

  if(listName === "Today") {
    item.save();
    res.redirect("/");
  } else{
    List.findOne({ name: listName })
    .then(function (foundList)
      {
        foundList.items.push(item);
        foundList.save();
        res.redirect("/" + listName);
    }).catch(err => {
      console.log(err);
  });
  }

  

});

app.post("/delete", function(req, res){
  const checkedItemID = req.body.checkbox;
  const listName = req.body.listName;



  if ( listName === "Today"){
    Item.findByIdAndRemove(checkedItemID).then(function(){
      console.log("Sucessful removed");
    }) .catch(function(err){
      console.log("err");
    }); 
  
    res.redirect("/");
  }
  else {
    List.findOneAndUpdate({name: listName}, {$pull:{ items:{_id:checkedItemID }}}, {new: true}).then(function(foundlist){
      res.redirect("/" + listName);
    }).catch( err => console.log(err));  
}
});
 
app.get("/about", function(){
  res.render("about"); 
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function (){
  console.log("Server has started successfully");
});