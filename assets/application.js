document.addEventListener('DOMContentLoaded', function() {
    updateCartQty();
})
  
const updateCartQty = function() {
    let qtySelectors = document.querySelectorAll(".js-quantity-btn");
    let quantityField = document.querySelector(".js-quantity-field");
    let quantityFieldVal = parseInt(quantityField.value);
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
        max = quantityField.attributes.max && parseInt(quantityField.attributes.max.value);
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

