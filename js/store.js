const store = new Vuex.Store({
    state : {
        products : [],
        users : [],
        cart : [],
        modalMsg : ""
    },
    getters : {
        getProducts : state => state.products,
        cart : state => state.cart,
        modalMsg : state => state.modalMsg,
        getProduct : state => {
            return (from, productId) => {
                return state[from] ? state[from].find((product) => {
                    return product.id == productId;
                }) : {};
            };
        },
        getIndex : state => {
            return (from, productId) => {
               for(let i in state[from]){
                    if(state[from][i].id == productId){
                        return i;
                    }
                };
            };
        }   
    },
    mutations : {
        updateStore(state){
            let products = db.select(['*']).from('products');
            let cart = db.select(['*']).from('cart');
            state.products = products;
            state.cart = cart;
        }
    },
    actions : {
        dismissModal(context, payload){
            payload.vm.$refs.modalCont.style.display = "none";
            this.state.modalMsg = '';
        },
        showModal(context, payload){
            this.state.modalMsg = payload.modalMsg;
            payload.vm.$refs.modalCont.style.display = "flex";
        },
    
    }
})