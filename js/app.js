const db = new EasyStorage('shopping');
const router = new VueRouter({
    routes
});
new Vue({
    router,
    store,
    created(){
        this.createTables();
        let products = db.select(['*']).from('products');
        let cart = db.select(['*']).from('cart');
        this.$store.state.products = products;
        this.$store.state.cart = cart;
        this.hideSpinner();
    },
    computed : {
        ...Vuex.mapGetters({
            products : 'products',
            cart : 'cart',
            modalMsg : 'modalMsg'
        }),
    },
    methods : {
       dismissModal(){
           this.$store.dispatch('dismissModal', {
                vm : this
           })
       },
       hideSpinner(){
        document.getElementsByClassName('spinner-container')[0].style.display = 'none';
       },
       createTables(){
        if(! db.tableExist('products') ){
            db.create('products', {
                id : {
                    type : 'Number',
                    key : true
                },
                name : {
                    type : 'String',
                },
                stock : {
                    type : 'Number',
                },
                price : {
                    type : 'Number',
                },
                quantity : {
                    type : 'Number',
                },
                image : {
                    type : 'String'
                }
            });
        }if(! db.tableExist('cart')){
            db.create('cart', {
                id : {
                    type : 'Number',
                    key : true
                },
                productId : {
                    type : 'Number',
                },
                quantity : {
                    type : 'Number',
                },
            });
        }
    }
    }
}).$mount('#app');