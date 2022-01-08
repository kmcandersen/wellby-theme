// submitting add to cart form, or removing a line item from the cart: updates Shopify cart, mini-cart & cart qty badge in header without refresh 
// need AJAX to update mini-cart bc liquid doesn't update wo refresh; liquid-only cart OK bc only accessed after a refresh

document.addEventListener('DOMContentLoaded', function() {
    setupAddForm();
    addToCart();
    handleMiniCart();
})
  
const setupAddForm = function() {
    let qtySelectors = document.querySelectorAll(".js-quantity-btn");
    let quantityField = document.querySelector(".js-quantity-field");
    let quantityFieldVal = quantityField && parseInt(quantityField.value);
    let quantityLabel = document.querySelector(".js-quantity-text");
    let variantRadioBtns = document.querySelectorAll(".js-variant-radio");
    // if variants, disabled until one is selected
    let addToCartBtn = document.querySelector("#add-to-cart-btn");   
    // if variants, disabled until one is selected
    let plusBtn = document.querySelector(".plus");
    let minusBtn = document.querySelector(".minus");
    // max attr on quantityField will be set to inventory of (selected) item
    let max = null;

    // no variants: inventory captured in input field; variants: inventory captured in each variant/radio btn element
    
    // product wo variants - get inventory, set max variable
    if (!variantRadioBtns.length){
        max = quantityField && parseInt(quantityField.attributes.max.value);
    }

    // product with variants
    if (variantRadioBtns.length > 0){      
        variantRadioBtns.forEach(btn => {
            btn.addEventListener('change', function(){
                // update max attribute, set max variable
                quantityField.setAttribute("max", btn.dataset.inventoryQuantity);
                max = btn.dataset.inventoryQuantity;
                 // resets to 1 when new variant selected to prevent selecting a qty for one variant that exceeds inventory of another variant
                quantityFieldVal = 1;
                quantityLabel.textContent = 1;
                quantityField.value = 1;

                // enables plusBtn when variant selected
                resetBtns();
                // enables add to cart when variant selected
                if (addToCartBtn.attributes.disabled) {
                    addToCartBtn.removeAttribute("disabled");
                }
            })
        })
    }

    if (qtySelectors.length > 0){
        qtySelectors.forEach(selector => {
            selector.addEventListener('click', function(){
                // quantityFieldVal holds curr selected qty 
                if (selector.classList.contains('plus')){
                    quantityFieldVal += 1;
                } else if (selector.classList.contains('minus')){
                    quantityFieldVal -= 1;
                }

                resetBtns();
                
                // qty updated in label .js-quantity-text & (hidden) input
                quantityLabel.textContent = quantityFieldVal;
                quantityField.value = quantityFieldVal;      
            })          
        })
    }

    const resetBtns = function() {             
        // if qty == 1, disable minus btn
        if (quantityFieldVal == 1) {
            minusBtn.setAttribute("disabled", "disabled");
        } else if (minusBtn.attributes.disabled) {
            minusBtn.removeAttribute("disabled");
        }                    
        // if qty = max/inventory, disable plus btn
        if (quantityFieldVal == max) {
            plusBtn.setAttribute("disabled", "disabled");
            console.log('maximum qty selected')
        } else if (plusBtn.attributes.disabled) {
            plusBtn.removeAttribute("disabled");
        }
    }

}

const addToCart = function() {
    const addToCartForm = document.querySelector('#add-to-cart-form') || null;

    if (addToCartForm) {   
        addToCartForm.addEventListener('submit', function(event) {
        // don't open cart page
        event.preventDefault()

        const getSelectedItem = function() {
            const itemVariants = document.querySelectorAll('.js-variant-radio') || null;
            const itemNoVariant = document.querySelector('.js-no-variant') || null;
            if (itemVariants.length) {
                for (const variant of itemVariants) {
                    if (variant.checked) {
                        return variant.value;
                    }
                }
            } else if (itemNoVariant) {
                return itemNoVariant.value;
            } else {
                return null;
            }    
        }

        const selectedItemId = getSelectedItem();

        let formData = {
        'items': [{ 
                'id': selectedItemId,
                'quantity': document.querySelector('.js-quantity-field').value 
            }]
        }

        fetch('/cart/add.js', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        })
        .then(response => {
            return response.json();       
        })
        .then((data) => {
            updateMiniCart()
        })
        .catch((error) => {
            console.error('Error:', error);
        });
    })
}}

// used in addToCart & removeMiniCartLine event listeners
const updateMiniCart = function() {
    // ajax call to get html of updated Cart page; save to var
    // delete existing content of js-mini-cart-contents (everything inside the cart-contents snippet rendered in mini-cart)
    // append cart html to js-mini-cart-contents, apply removeMiniCartLine event listener
    // updated cart item count is in html--replace in header
    fetch('/cart')
        .then((response) => {
            return response.text();
        })
        .then(function (html) {
            // Convert html string into a document object
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
        
            // Get the html inside .js-cart-page-contents (starting with .text-white)
            const cart = doc.querySelector('.js-cart-page-contents');
            const cartContents = cart.children;
            const miniCartContainer = document.querySelector('.js-mini-cart-contents') || null;
            if (miniCartContainer) {
                const miniCartContents = miniCartContainer.querySelector('.js-cart-snippet-contents')
                miniCartContainer.removeChild(miniCartContents)
                miniCartContainer.appendChild(cartContents[0])
                // apply event listener to newly appended 'remove line item' buttons in mini-cart
                removeMiniCartLine()
            }

            // get updated item count from Cart wrapper data attribute
            const updatedCartItemCount = cart.dataset.cartItemCount;
            // update cart count in header
            document.querySelector(".js-cart-item-count").textContent = updatedCartItemCount;

            const htmlContainer = document.querySelector('html');
            if (updatedCartItemCount > 0){
                htmlContainer.classList.add("mini-cart-open");
            } else {
                htmlContainer.classList.remove("mini-cart-open"); 
            }
           
        
        })
        .catch((err) => console.error(err));
}

// applies an event listener to 'remove' btns in mini-cart
// Must run after mini-cart appended, not on initial load, so event listener is applied
function removeMiniCartLine() {
    // get remove btn(s) inside mini-cart only--not on Cart page
    const miniCartRemoveBtns = document.querySelectorAll('#mini-cart .js-remove-line');

    if (miniCartRemoveBtns) {
        miniCartRemoveBtns.forEach((btn) => {
            btn.addEventListener('click', function(event){
                // don't open cart page
                event.preventDefault()

                const urlString = btn.href.split('change?')[1]    
                const urlParams = new URLSearchParams(urlString)
                const line = urlParams.get('line')
                let formData = {                
                    'line': line,
                    'quantity': 0                
                }

                fetch('/cart/change.js', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                })
                .then(response => {
                    return response.json();       
                })
                .then((data) => {
                    updateMiniCart();
                })
                .catch((error) => {
                    console.error('Error:', error);
                });           
            })
        })
    }   
}

const handleMiniCart = function() {
    const htmlContainer = document.querySelector('html');
    const miniCartLink = document.querySelector('a.js-cart-link')
    miniCartLink.addEventListener('click', onMiniCartClick)

    const keepShoppingLink = document.querySelector('#mini-cart .js-keep-shopping-btn')
    keepShoppingLink.addEventListener('click', onMiniCartClick)

    function onMiniCartClick(event) {
        event.preventDefault();

        let isCartOpen = htmlContainer.classList.contains("mini-cart-open")
        if (!isCartOpen){
            htmlContainer.classList.add("mini-cart-open")
        } else {
            htmlContainer.classList.remove("mini-cart-open")
        }
    }
}