const filterList = {
    gender: [],
    category: [],
    size: [],
    colour: []
};
let sortMode = "name";
let filteredCatalog = [];
let highlight = null;
let chosenColour = null;
let chosenSize = null;

//Object containing summary info. Built on the fly, so no need to use localStorage.
const summary = {
    merchandise: 0,
    shipping: 0,
    tax: 0,
    total: 0
}

//The URL for our fetch
const url = "https://gist.githubusercontent.com/rconnolly/d37a491b50203d66d043c26f33dbd798/raw/37b5b68c527ddbe824eaed12073d266d5455432a/clothing-compact.json";


//Hardcoded to make things a bit easier.
const possibleAttributes = {
    category: [],
    size: [
        {key:"XL", value:"Extra Large", for: "Regular"},
        {key:"L", value:"Large", for: "Regular"},
        {key:"M", value:"Medium", for: "Regular"},
        {key:"S", value:"Small", for: "Regular"},
        {key:"XS", value:"Extra Small", for: "Regular"},
        {key:"24", value:"24\"", for: "Bottoms"},
        {key:"26", value:"26\"", for: "Bottoms"},
        {key:"28", value:"28\"", for: "Bottoms"},
        {key:"30", value:"30\"", for: "Bottoms"},
        {key:"32", value:"32\"", for: "Bottoms"},
        {key:"S/M", value:"Small/Medium", for: "Adaptable"},
        {key:"L/XL", value:"Large/Extra Large", for: "Adaptable"},
        {key:"One Size", value:"One Size Fits All", for: "Adaptable"},
        {key:"6", value:"6\"", for: "Shoes"},
        {key:"7", value:"7\"", for: "Shoes"},
        {key:"8", value:"8\"", for: "Shoes"},
        {key:"9", value:"9\"", for: "Shoes"},
        {key:"10", value:"10\"", for: "Shoes"}
    ],
    colour: [{name: "Black", hex: "#000000"}]
};


//This is our public static void main(String[] args). Once the DOM is loaded, builds all the event handlers we need.
document.addEventListener('DOMContentLoaded',  () => {
    if(localStorage.getItem("catalog") == null) {
        console.log("No catalog in local records! Fetching fresh!");
        fetchCatalog();
    } else {
        console.log("Catalog is populated. No need to fetch.");
    }

    if (localStorage.getItem("cart") == null) localStorage.setItem("cart", "[]");
    setCartCount();

    //Sets the page
    document.addEventListener("click", setpage);

    //Handles the category selectors on the home page
    document.querySelector("#jumpIntoCatalog").addEventListener("click", catFromHome);

    //Dropdown function
    document.querySelector("#browseSidebar").addEventListener("click", dropDown);

    //Handle filters
    document.querySelector("#browse").addEventListener("click", browserFilterHandler);

    //Remove a filter widget item
    document.querySelector("#filterWidget").addEventListener("click", popWidget);

    //Handles the toast object
    document.querySelector("#toastPurchase").addEventListener("click",closeToast);

    //closes the about section
    document.querySelector("#closeAbout").addEventListener("click",closeAboutSection);

    //Handle sorting mode
    document.querySelector("#sortMode").addEventListener("change", ()=>{
        sortMode = document.querySelector("#sortMode").value;
        //Each time the sorting mode is altered, regenerate the catalog
        regenCatalog();
    });

    //Document-wide/high-priority query selectors.
    document.querySelector("#catalog").addEventListener("click", clickProduct);
    document.querySelector("#relatedProducts").addEventListener("click", clickProduct);

    document.querySelector("#prodMiniGallery").addEventListener("mouseover", miniGallerySwitch);

    document.querySelector("#productBuyBar").addEventListener("click", buyBarHandler);

    //Builds our catalog
    buildAttributeList();
    regenCatalog();

});

//Runs a fetch for the catalog
function fetchCatalog() {
    fetch(url)
        .then(response => response.json()) // Parse JSON
        .then(data => saveCatalog(data)) // Work with JSON data
        .catch(error => console.error('Error fetching JSON:', error));
}

//---------Getters and setters for localStorage---------//
//Grabs and parses the cart from local storage
function getCart() {
    return JSON.parse(localStorage.getItem("cart"));
}

//Given an array, converts to a string and saves as the new cart.
function setCart(cart) {
    localStorage.setItem("cart", JSON.stringify(cart));
}

//Retrieves the catalog as a traversable array
function getCatalog() {
    return JSON.parse(localStorage.getItem("catalog"));
}



//Handles clicking the three catalog jump buttons in the homepage
function catFromHome(e) {
    if(e.target.classList.contains("jumperButton")) {
        let matchedSelector = document.querySelector("#browseSidebar").querySelector("input#"+e.target.dataset.cat);
        matchedSelector.click();
    }
}


//Saves fetched catalog to localStorage
function saveCatalog(data) {
    localStorage.setItem("catalog", JSON.stringify(data));
    console.log("Saved data");
}

//Builds filter attributes (allows us to dynamically handle new items not in an existing category)
function buildAttributeList() {
    let catalog = getCatalog();
    for(let i of catalog) {
        for(let size of i.sizes) {
            if(!possibleAttributes.size.find(e => e==size)) {
                possibleAttributes.size.push(size);
            }
        }
        for(let color of i.color) {
            if(!possibleAttributes.colour.find(e => e.hex===color.hex)) {
                possibleAttributes.colour.push({name: color.name, hex: color.hex});
            }
        }
        if(!possibleAttributes.category.find(e => e==i.category)) possibleAttributes.category.push(i.category);
    }
    addAttributesToFilter();
}

//Your function is to call the functions that add attributes (color, size, etc) to the filter.
function addAttributesToFilter() {
    addColorToFilter();
    addCategoriesToFilter();
    addSizesToFilter();
}

//Adds colors. Clones a template and adds it as a button.
function addColorToFilter() {
    const colorTemplate = document.getElementById('colorButtonTemplate');
    const coloursDiv = document.getElementById('coloursDiv');
    for(let c of possibleAttributes.colour) {
        let colorButton = colorTemplate.content.cloneNode(true);
        let button = colorButton.querySelector("input");
        let capitalizedName = String(c.name).charAt(0).toUpperCase() + String(c.name).slice(1);
        button.id=c.hex;
        button.dataset.name=capitalizedName;
        button.value=c.hex;
        button.classList.remove("bg-[#000000]");
        button.classList.add("bg-["+c.hex+"]");
        colorButton.querySelector("label").for=c.name;
        colorButton.querySelector("label").textContent=capitalizedName;
        coloursDiv.appendChild(colorButton);
    }
}

//Adds sizes. There's a lot of redundancy, but I want the widget to be able to parse data from any source,
//including sources more complex than this one.
function addCategoriesToFilter() {
    const categoryTemplate = document.getElementById('categoryButtonTemplate');
    const categoriesDiv = document.getElementById('categoryDiv');
    for(let c of possibleAttributes.category) {
        let categoryButton = categoryTemplate.content.cloneNode(true);
        let button = categoryButton.querySelector("input");
        let label = categoryButton.querySelector("label");
        button.id=c;
        button.value=c;
        button.dataset.name=c;
        label.for=c;
        label.textContent=c;
        categoriesDiv.appendChild(categoryButton);
    }
}

//Adds sizes to our filter
function addSizesToFilter() {
    const sizeTemplate = document.getElementById('sizeButtonTemplate');
    
    for(let size of possibleAttributes.size) {
        let sizeButton = sizeTemplate.content.cloneNode(true);
        let button = sizeButton.querySelector("input");
        let label = sizeButton.querySelector("label");
        button.id=size.key;
        button.value=size.key;
        button.dataset.name=size.value;
        label.for=size.key;
        label.textContent=size.value;
        
        let destination = document.getElementById("sizeGroup-"+size.for);
        if(destination!=null) destination.appendChild(sizeButton);
        
    }

}




//Manages the appearance of dropdown lists.
function dropDown(e) {
    //Get the chosen category to open.
    let listTarget = null;
    if(e.target.nodeName === "H2") {
        if(e.target.parentNode.classList.contains("filterBut")) {
            listTarget = e.target.parentNode;
        }
    } else if(e.target.classList.contains("filterBut")) {
        listTarget = e.target;
    }

    //Open said category.
    if(listTarget) {
        if(listTarget.nodeName === "BUTTON") {
            listTarget.querySelector(".dropArrow").classList.toggle("rotate-180");
        }
        let filterDiv = listTarget.parentNode.querySelector("#"+listTarget.id+"Div");

        filterDiv.classList.toggle("max-h-0");
        if(filterDiv.classList.contains("max-h-0")) {
            filterDiv.style.maxHeight = "0px";
        } else {
            //This is hideous. Ask the prof about this ASAP.
            //Link to where I found the trick: https://stackoverflow.com/questions/76048428/html-textarea-why-does-textarea-style-height-textarea-scrollheight-px-exp 
            filterDiv.style.maxHeight = filterDiv.scrollHeight + "px";
        }

    }

}


//Manages adding and removing items from our filter list.
function browserFilterHandler(e) {
    if(e.target) {
        if(e.target.nodeName === "INPUT") {
            if(e.target.checked) {
                addToFilterList(e.target.value, e.target.dataset.attr, e.target.dataset.name);
            } else {
                removeFromFilterList(e.target.value, e.target.dataset.attr, e.target.dataset.name);
            }
        }
    }
}

//Add to filter
//We use key-value pairs to pass both a label and a parseable value (useful for colors, which have a hex and a name)
function addToFilterList(key, filterType, value) {
    if(filterList[filterType].find(i => i == key)) {
        console.log(value+" is already in filter list.");
    } else {
        addToWidget(key, value, filterType);
        filterList[filterType].push({key: key, value: value});
        regenCatalog();
    }
}

//Similar. Removes values from filter.
function removeFromFilterList(key, filterType, value) {
    //Find a value
    if(filterList[filterType].find(i => i.key == key)) {
        filterList[filterType].splice(filterList[filterType].findIndex(i => i.key===key), 1);
        removeFromWidget(key);
        regenCatalog();
    } else {
        //If not found, logs in console. This should never happen.
        console.log("ERROR: "+value+" is not in filterlist. (key is "+key+")");
    }
}


//Adds items to the filter widget.
function addToWidget(key, value, filterType) {
    const widgetTemplate = document.getElementById('widgetTemplate');
    let filterWidgetDiv = document.getElementById('filterWidget');
    let widget = widgetTemplate.content.cloneNode(true);
    let button = widget.querySelector("button");
    let contents = widget.querySelector("p");
    //Nice bells and whistles to customize color values
    if(filterType === "colour") {
        //Replaces widget color with the desired color key
        button.classList.remove("bg-gray-400");
        button.classList.add("bg-["+key+"]");
        //Perform surgery on the hex, parse it into ints
        let hex = key.slice(1);
        let r = parseInt(hex.substring(0,2),16);
        let g = parseInt(hex.substring(2,4),16);
        let b = parseInt(hex.substring(4,6),16);
        //Get a darker shade of the original
        let darkAndEvilRGB = [r-Math.round(r/2),g-Math.round(g/2),b-Math.round(b/2)];
        //Depending on the shade, changes the text color
        if(r>127 && g>127 && b>127) {
            button.classList.remove("text-white");
            button.classList.add("text-black");
        }
        //Builds a hex with the darker shade
        let hexR = darkAndEvilRGB[0].toString(16);
        let hexG = darkAndEvilRGB[1].toString(16);
        let hexB = darkAndEvilRGB[2].toString(16);
        //Adds this new hover shade into the classlist
        button.classList.remove("hover:bg-gray-500");
        button.classList.add("hover:bg-[#"+hexR+hexG+hexB+"]");
    }

    button.dataset.filterType = filterType;
    button.dataset.key = key;
    button.id = "widget-"+key;
    contents.textContent="X "+value;
    filterWidgetDiv.appendChild(widget);
}

//Remove items from the filter widget
function removeFromWidget(key) {
    let targetWidget = document.getElementById("widget-"+key);
    let widgetDiv = document.getElementById('filterWidget');
    if(targetWidget != undefined) widgetDiv.removeChild(targetWidget);
}

//Removes a widget when clicked, and 
function popWidget(e) {
    let targetWidget = null;
    if(e.target.nodeName === "P") {
        targetWidget = e.target.parentNode;
    } else {
        targetWidget = e.target;
    }
    let targetID = targetWidget.id.split("-")[1];
    let relatedInput = document.getElementById(targetID);
    relatedInput.checked=false;
    removeFromFilterList(targetID, targetWidget.dataset.filterType, targetID);
    removeFromWidget(targetID);

}


//Sets which page is currently displaying
function setpage(e) {
    
    if(e.target.classList.contains("navbut")) {
        let destination = e.target.dataset.view;
        //Quick, dirty and spammy. I wonder if I could array.find() this instead. Probably wouldn't be performant.
        switch(destination) {
            case "home":
                document.querySelector("#home").classList.remove("hidden");
                document.querySelector("#browse").classList.add("hidden");
                document.querySelector("#product").classList.add("hidden");
                document.querySelector("#cart").classList.add("hidden");
                break;
            case "browse":
                document.querySelector("#home").classList.add("hidden");
                document.querySelector("#browse").classList.remove("hidden");
                document.querySelector("#product").classList.add("hidden");
                document.querySelector("#cart").classList.add("hidden");
                break;
            case "product":
                document.querySelector("#home").classList.add("hidden");
                document.querySelector("#browse").classList.add("hidden");
                document.querySelector("#product").classList.remove("hidden");
                document.querySelector("#cart").classList.add("hidden");
                break;
            case "about":
                if(document.querySelector("#about").classList.contains("hidden")) openAboutSection();
                else closeAboutSection();
                break;
            case "cart":
                document.querySelector("#home").classList.add("hidden");
                document.querySelector("#browse").classList.add("hidden");
                document.querySelector("#product").classList.add("hidden");
                document.querySelector("#cart").classList.remove("hidden");
                buildCartPage();
                break;
            default:
                console.log("Haha nope");
        }


    }
}


//Builds our catalog per applied filters
function regenCatalog() {
    let displayList = [];
    if(filterList.category.length>0 || filterList.colour.length>0 || filterList.gender.length>0 || filterList.size.length>0) {
        displayList = applyFilters(getCatalog());
    } else {
        displayList = getCatalog();
    }
    switch(sortMode) {
        case "priceHi":
            displayList.sort((a, b) => b.price - a.price);
            break;
        case "priceLo":
            displayList.sort((a, b) => a.price - b.price);
            break;
        case "category":
            displayList.sort((a, b) => a.category.localeCompare(b.category));
            break;
        default:
            displayList.sort((a, b) => a.name.localeCompare(b.name));
    }
    if(displayList.length>0) displayCatalog(displayList);
    else displayBitterFailure();
}


//Displays the catalog by copying the item template
function displayCatalog(array) {
    const catalogItemTemplate = document.getElementById("catalogItemTemplate");
    const catalogDestination = document.getElementById("catalog");
    catalogDestination.innerHTML="";
    for(let item of array) {
        let catalogItem = catalogItemTemplate.content.cloneNode(true);

        let itemImageDiv = catalogItem.querySelector(".itemImageDiv");
        let itemImage = catalogItem.querySelector(".itemImage");
        let itemInfoDiv = catalogItem.querySelector(".itemInfoDiv");
        let itemName = catalogItem.querySelector(".itemName");
        let itemPrice = catalogItem.querySelector(".itemPrice");
        let catalogCard = catalogItem.querySelector(".catalogCard");

        catalogCard.dataset.prodid = item.id;
        //I could do this with closest(), but I don't like closest(). Once is already too many times :/
        itemImageDiv.dataset.value = item.id;
        itemImage.src = "images/"+item.category+".jpg";
        itemInfoDiv.dataset.value = item.id;
        itemName.textContent = item.name;
        itemPrice.textContent = "$"+item.price.toFixed(2);
        catalogDestination.appendChild(catalogItem);
    }
}


//Click a card to check its product page
function clickProduct(e) {
    let chosenCard = e.target.closest(".catalogCard");
    highlight = chosenCard.dataset.prodid;
    buildProductPage();
    document.querySelector("#home").classList.add("hidden");
    document.querySelector("#browse").classList.add("hidden");
    document.querySelector("#product").classList.remove("hidden");
    document.querySelector("#cart").classList.add("hidden");
}


//If nothing matches the filter, displays a failure message.
function displayBitterFailure() {
    const failureItemTemplate = document.getElementById("failureItemTemplate");
    const catalogDestination = document.getElementById("catalog");
    catalogDestination.innerHTML="";
    let failureScreen = failureItemTemplate.content.cloneNode(true);
    catalogDestination.appendChild(failureScreen);
}


/*
Here's the gameplan.
I want to run a big foreach for everything in the array. 
- For each critera (gender, category, size, colour), we iterate through the filterArray with find() [ask Randy if this is performant]
- Each criteria is represented by a bool. True by default, false if a match is not found. 
- Perhaps each search can call a critera-agnostic function for array-based criteria (the first three)
If a match is found, that function returns true and the flag for that criteria is labelled as true.


=== SIDE TANGENT ===
I did wonder what chatGPT had to say (did NOT upload any code, of course), 
and it spat out a "return Object.entries(FilterList).every(([field, filterValues]) => {...}" abomination. 

Do ask what the hell it was trying to cook there, but count your lucky stars you're not blindly throwing stuff like that 
into your project without knowing why.

This must be the "really cutting edge" thing Randy mentioned.
*/
//Applies filters each time the catalog is regenerated.
function applyFilters(array) {
    let filtered = [];
    for(let item of array) {
        let genderValid = checkFilter(item.gender, "gender");
        let categoryValid = checkFilter(item.category, "category");;
        let sizeValid = checkFilter(item.sizes, "size");
        let colourValid = checkFilter(item.color, "colour");;

        if(genderValid && categoryValid && sizeValid && colourValid) filtered.push(item);
    }

    return filtered;
}

//This is our actual filter. Given a category, returns true if it matches our filter and false if it does not.
function checkFilter(category, filterType) {
    let criteria = filterList[filterType];
    //If the given filter criteria is empty, return true.
    if(criteria.length == 0) return true;

    //Else, let the search begin
    if(filterType === "size") {
        let found = false;
        for(let item of category) {
            let yoinkedCriteria = criteria.find((e) => e.key === item);
            if(yoinkedCriteria != undefined) {
                found = true;
                break;
            }
        }
        return found;
    } else if(filterType === "colour") {
        let found = false;
        for(let item of category) {
            let yoinkedCriteria = criteria.find((e) => e.key === item.hex);
            if(yoinkedCriteria != undefined) {
                found = true;
                break;
            }
        }
        return found;
    } else {
        let yoinkedCriteria = criteria.find((e) => e.key === category);
        if(yoinkedCriteria != undefined) return true;
        else return false;
    }
}


//Switches the dominant image in the product page gallery
function miniGallerySwitch(e) {
    if(e.target.nodeName === "IMG") {
        document.querySelector("#prodHeroImage").src = e.target.src;
        let miniGallery = document.querySelectorAll("#prodMiniGallery img");
        for(let i of miniGallery) {
            if(i.src != e.target.src) {
                i.classList.remove("ring-1");
                i.classList.remove("ring-offset-2");
                i.classList.remove("ring-gray-600");
            } else {
                i.classList.add("ring-1");
                i.classList.add("ring-offset-2");
                i.classList.add("ring-gray-600");
            }
            
        }
    }
}


//Sets the product page to the image contained in highlight
function buildProductPage() {
    let catalog = getCatalog();
    let productPage = document.querySelector("#product");
    let product = catalog.find(e => e.id == highlight);
    productPage.querySelector("#prodHeroImage").src="images/"+product.category+".jpg";
    productPage.querySelector("#prodImageSwappable").src="images/"+product.category+".jpg";

    productPage.querySelector("#prodCat").textContent=product.category;
    productPage.querySelector("#prodPrice").textContent="$"+product.price.toFixed(2);
    productPage.querySelector("#prodDesc").textContent=product.description;
    productPage.querySelector("#prodName").textContent=product.name;
    productPage.querySelector("#prodMaterial").textContent=product.material;
    productPage.querySelector("#numQuantity").value = 1;
    
    if(product) buildBreadcrumb(product);
    if(product) buildSimilarProducts(product);

    let sizeList = productPage.querySelector("#prodSizes");
    sizeList.innerHTML = "";
    const sizeListTemplate = productPage.querySelector("#prodSizeTemplate");

    for(let size of product.sizes) {
        let sizeItem = sizeListTemplate.content.cloneNode(true);
        let input = sizeItem.querySelector("input");
        let label = sizeItem.querySelector("label");

        input.textContent = size;
        input.value = size;
        label.textContent = size;
        input.id="prodBox-"+size;
        label.htmlFor=input.id;
        sizeList.appendChild(sizeItem);
    }
    //Select the first size
    productPage.querySelector("input.sizeButton").checked=true;

    let colourList = productPage.querySelector("#prodColours");
    colourList.innerHTML = "";
    const colourListTemplate = productPage.querySelector("#prodColourTemplate");
    for(let color of product.color) {
        let colorItem = colourListTemplate.content.cloneNode(true);
        let colorInput = colorItem.querySelector("input");
        colorInput.classList.remove("bg-[#000000]");
        colorInput.classList.add("bg-["+color.hex+"]");
        colorInput.id="prodColourButton-"+color.hex;
        colorInput.dataset.name=color.name;
        colourList.appendChild(colorItem);
    }
    //Select the first color
    productPage.querySelector("input.prodColourButton").checked=true;

    //Default color and size
    chosenSize = product.sizes[0];
    chosenColour = product.color[0];

    //Event listeners
    productPage.addEventListener("click", prodAttrCheck);

}


//Builds the breadcrumb (top of the page)
function buildBreadcrumb(product) {
    let capitalizedGender = product.gender.charAt(0).toUpperCase() + product.gender.slice(1);
    document.querySelector("#breadcrumb").textContent = capitalizedGender+" > "+product.category+" > "+product.name;
}

//We find up to 5 similar products and build a little list below the main product
function buildSimilarProducts(product) {
    let gender = product.gender;
    let catalog = getCatalog();
    let relatedList = catalog.filter(related => {
        return related.gender === gender && related.category === product.category && related.id != product.id;
    });
    displaySimilar(relatedList.slice(0,3));
}


//Displays similar items by copying the item template
function displaySimilar(array) {
    const catalogItemTemplate = document.getElementById("catalogItemTemplate");
    const relatedDestination = document.getElementById("relatedProducts");
    relatedDestination.innerHTML="";
    for(let item of array) {
        let catalogItem = catalogItemTemplate.content.cloneNode(true);

        let itemImageDiv = catalogItem.querySelector(".itemImageDiv");
        let itemImage = catalogItem.querySelector(".itemImage");
        let itemInfoDiv = catalogItem.querySelector(".itemInfoDiv");
        let itemName = catalogItem.querySelector(".itemName");
        let itemPrice = catalogItem.querySelector(".itemPrice");
        let catalogCard = catalogItem.querySelector(".catalogCard");

        catalogCard.dataset.prodid = item.id;
        //I could do this with closest(), but I don't like closest(). Once is already too many times :/
        itemImageDiv.dataset.value = item.id;
        itemImage.src = "images/"+item.category+".jpg";
        itemInfoDiv.dataset.value = item.id;
        itemName.textContent = item.name;
        itemPrice.textContent = "$"+item.price.toFixed(2);
        relatedDestination.appendChild(catalogItem);
    }
}



//Handles interactions with the product page purchase bar.
function buyBarHandler(e) {
    let selectedButton = e.target;
    let numQuantity = document.querySelector("#numQuantity");
    switch(selectedButton.id) {
        case "incQuant":
            if(numQuantity.value<99) numQuantity.value++;
            break;
        case "decQuant":
            if(numQuantity.value>=0) numQuantity.value--;
            break;
        case "prodAddToCart":
            addToCart(highlight, Number(numQuantity.value), chosenSize, chosenColour);
            break;
        default:
            break;
    }
}



//Check an item
function prodAttrCheck(e) {
    if(e.target.classList.contains("sizeButton") && e.target.nodeName==="INPUT") {
        chosenSize = e.target.id.split("-")[1];
        let sizeBox = document.querySelector("#prodSizes");
        let checkValues = sizeBox.querySelectorAll("input.sizeButton");
        for(let box of checkValues) {
            if(box.checked && box.id!=e.target.id) box.checked = false;
        }
    } else if(e.target.classList.contains("prodColourButton")) {
        chosenColour={
            hex: "#"+e.target.id.split("#")[1],
            name: e.target.dataset.name
        };
    }
    
}


//--------------------------------------------- CART PAGE ----------------------------------------------



//Adds an item to the cart
function addToCart(id, quant, size, colour) {
    let catalog = getCatalog();
    let product = catalog.find(e => e.id === id);
    let cart = getCart();
    if(product) {
        let matchInCart = cart.findIndex(e=>e.item.id === product.id  && e.size === size && e.colour.hex === colour.hex);
        if(matchInCart < 0 || cart[matchInCart].size != size) {
            cart.push({item:product,quantity:quant,size:size,colour:colour});
            setCart(cart);
        } else {
            if(cart[matchInCart]) {
                cart[matchInCart].quantity = cart[matchInCart].quantity + quant;
                if(cart[matchInCart].quantity > 99) cart[matchInCart].quantity = 99;
                setCart(cart);
            }
        }
        setCartCount();
    }

}

//Simply adjusts the cart count on the top widget.
function setCartCount() {
    document.querySelector(".cartCount").textContent = getCart().length;
}

/*
This is gonna be a doozy. Not only are we building the actual table of items in the cart, but we're setting up event listeners too.
*/
function buildCartPage() {
    let cartPage = document.querySelector("#cart");
    cartPage.addEventListener("click", cartItemHandler);
    cartPage.addEventListener("change", alterQuantityInput);
    buildCartTable();
    cartPage.querySelector("#shippingBox").addEventListener("change", setTransportMode);
    cartPage.querySelector("#buyTheStuff").addEventListener("click", makePurchase);
}

//Builds the table to reflect out cart object
function buildCartTable() {
    const cartItemTemplate = document.querySelector("#CartItemTemplate");
    const destination = document.querySelector("#cartTable");
    let cart = getCart();
    destination.innerHTML="";
    for(cartObj of cart) {
        let row = cartItemTemplate.content.cloneNode(true);
        row.querySelector(".cartRow").dataset.prodid = cartObj.item.id;
        row.querySelector(".cartItemName").textContent = cartObj.item.name;
        row.querySelector(".cartItemCategory").textContent = cartObj.item.category;
        row.querySelector(".numQuantity").value = cartObj.quantity;

        row.querySelector(".cartItemPrice").textContent = "$"+(cartObj.item.price).toFixed(2);
        row.querySelector(".cartItemTotal").textContent = "$"+(cartObj.item.price*cartObj.quantity).toFixed(2);

        row.querySelector(".cartItemColour").classList.remove("bg-[#000000]");
        row.querySelector(".cartItemColour").classList.add("bg-["+cartObj.colour.hex+"]");
        row.querySelector(".cartItemColourName").textContent = cartObj.colour.name;
        row.querySelector(".cartItemSize").textContent = cartObj.size;

        row.querySelector("img").src = "images/"+cartObj.item.category+".jpg";
        destination.appendChild(row);
    }
    buildSummary();
}

function cartItemHandler(e) {
    let targetRow = e.target.closest("tr");
    if(e.target.classList.contains("cartItemRemove")) {
        removeCartItem(targetRow.dataset.prodid);
        return;
    }

    if(e.target.classList.contains("quantityControl")) {
        let numQuantity = targetRow.querySelector(".numQuantity");
        if(e.target.classList.contains("decQuant")) {
            numQuantity.value--;
            alterCartItemQuantity(targetRow.dataset.prodid, numQuantity.value);
            setTotalCostForItem(e);
        } else if(e.target.classList.contains("incQuant")) {
            if(numQuantity.value < 99) {
                numQuantity.value++;
                alterCartItemQuantity(targetRow.dataset.prodid, numQuantity.value);
                setTotalCostForItem(e);
            }
        }

    }
}

//Removes an item from the cart array and from our table
function removeCartItem(id) {
    let cart = getCart();
    if(cart.length>1) cart.splice(cart.findIndex(e=>e.item.id == id), 1);
    else cart = [];
    setCart(cart);
    buildCartTable();
    setCartCount();
}

//Handles changes to the quantity number input box
function alterQuantityInput(e) {
    if(e.target.classList.contains("numQuantity")) {
        let targetRow = e.target.closest("tr");
        alterCartItemQuantity(targetRow.dataset.prodid, e.target.value);
        setTotalCostForItem(e);
    }
}

//Sets the quantity of an item to this amount
function alterCartItemQuantity(id, amount) {
    cart=getCart();
    cart.find(e=>e.item.id === id).quantity = Number(amount);
    if(amount <= 0) removeCartItem(id);
    else setCart(cart);
    buildSummary();
}

//Sets an item's total cost
function setTotalCostForItem(e) {
    let targetRow = e.target.closest("tr");
    let price = targetRow.querySelector(".cartItemPrice");
    let total = targetRow.querySelector(".cartItemTotal");
    let quant = targetRow.querySelector(".numQuantity");
    console.log("Found targetrow "+targetRow.dataset.prodid);
    total.textContent = "$"+(quant.value * Number(price.textContent.slice(1))).toFixed(2);
}

//Constructs the summary section of the cart page.
function buildSummary() {
    let orderSummary = document.querySelector("#orderSummary");
    //Manipulates summary object data
    summary.merchandise = sumCart();
    if(summary.merchandise==0) {
        summary.shipping=0;
        summary.tax=0;
    } else {
        if(summary.merchandise>=500) summary.shipping = 0;
        else summary.shipping = lookupShippingCost();
        if(document.querySelector("#shippingDest").value === "canada") summary.tax = 0.05;
        else if(document.querySelector("#shippingDest").value==="interplanetary") summary.tax = 0.25;
        else summary.tax = 0;
    }

    //With all data manipulated, displays it in the div.
    orderSummary.querySelector("#orderMerchandise").textContent = "$"+(summary.merchandise).toFixed(2);
    orderSummary.querySelector("#orderShipping").textContent = "$"+(summary.shipping).toFixed(2);
    orderSummary.querySelector("#orderTax").textContent = "$"+(summary.tax*100).toFixed(2);
    orderSummary.querySelector("#orderTotal").textContent = "$"+(summary.merchandise + (summary.merchandise * summary.tax) + summary.shipping).toFixed(2);
    document.querySelector("#shippingDesc").textContent = getShippingDesc();
}

//Gets the sum of the cart
function sumCart() {
    let cart = getCart();
    let sum = 0;
    for(prod of cart) {
        sum += prod.quantity * prod.item.price;
    }
    return sum;
}


//A simple lookup chart for shipping costs. Slightly expanded for new entries.
//Bloaty, but relatively straightforward.
function lookupShippingCost() {
    let mode = document.querySelector("#shippingMode").value;
    let dest = document.querySelector("#shippingDest").value;
    switch(mode) {
        case "standard":
            switch(dest) {
                case "canada": 
                    return 10;
                case "usa":
                    return 15;
                case "international":
                    return 20;
                case "interplanetary":
                    return 67;
                default:
                    return 10;
            }
        case "express":
            switch(dest) {
                case "canada": 
                    return 25;
                case "usa":
                    return 25;
                case "international":
                    return 30;
                case "interplanetary":
                    return 90;
                default:
                    return 25;
            }
        case "priority":
            switch(dest) {
                case "canada": 
                    return 35;
                case "usa":
                    return 50;
                case "international":
                    return 50;
                case "interplanetary":
                    return 100;
                default:
                    return 35;
            }
        case "ultraspeed":
            switch(dest) {
                case "canada": 
                    return 50;
                case "usa":
                    return 50;
                case "international":
                    return 50;
                case "interplanetary":
                    return 200;
                default:
                    return 50;
            }
        case "ghoul":
            switch(dest) {
                case "canada": 
                    return 2;
                case "usa":
                    return 3;
                case "international":
                    return 4;
                case "interplanetary":
                    return 21;
                default:
                    return 2;
            }
        default:
            return 21;
    }
}

//When the shipping mode is modified, reconstruct the summary.
function setTransportMode(e) {
    buildSummary();
}

//Gets the description for the selected shipping mode. Builds out of separate components, which is far simpler than the gigaSwitch above.
function getShippingDesc() {
    let mode = document.querySelector("#shippingMode").value;
    let dest = document.querySelector("#shippingDest").value;
    let descA = "";
    let descB = "";
    switch(mode) {
        case "standard":
            descA = " Bingus™ courier truck ";
            break;
        case "express":
            descA = " Bingus™ high-speed transport drone ";
            break;
        case "priority":
            descA = " Bingus™ submarine-launched scramjet ";
            break;
        case "ultraspeed":
            descA = " Bingus™ Torchship ";
            break;
        case "ghoul":
            descA = "n undead monster ";
            break;
        case "default":
            descA = "n unknown Thing ";
            break;
    }
    switch(dest) {
        case "canada": 
            descB = " drop your order off at ";
            break;
        case "usa":
            descB = " transport your order to ";
            break;
        case "international":
            descB = " journey across the seas to ";
            break;
        case "interplanetary":
            descB = " cross the stars to ";
            break;
        default:
            descB = " shlep to ";
            break;
    }
    return "A"+descA+"will"+descB+"your residence.";
}

//Closes the toast. Automatically fired when the toast appears.
function closeToast() {
    let toast = document.querySelector("#toastPurchase");
    toast.classList.add('opacity-0');

    setTimeout(() => {
        toast.classList.add("hidden");
    }, 200);  
}


function makePurchase(e) {
    localStorage.setItem("cart", "[]")
    buildCartPage();
    setCartCount();
    let toast = document.querySelector("#toastPurchase");
    toast.classList.remove("opacity-0");
    toast.classList.add("opacity-100");
    toast.classList.remove("hidden");
    setTimeout(() => {
        closeToast();
    }, 1000);  

}


function openAboutSection() {
    let about = document.querySelector("#about");
    about.classList.remove("opacity-0");
    about.classList.add('opacity-100');
    about.classList.remove("hidden");
}

function closeAboutSection() {
    let about = document.querySelector("#about");
    about.classList.add('opacity-0');
    about.classList.remove("opacity-100");
    setTimeout(() => {
        about.classList.add("hidden");
    }, 200); 

}