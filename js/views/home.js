const homeView = {
    data(){
        return {
            products : [],
            searchInput : "",
            isSearch : false,
            currentPage : 1,
        }
    },
    created(){
        document.title = "simple shopping - Home";
        this.currentPage = Object.keys(this.$route.query).length ? this.$route.query.page : 1;
        this.setProducts();
        db.addEventListener('tabupdate', () => {
            this.$store.commit('updateStore');
            this.setProducts();
        });
    },    
    watch :{
        searchInput() {
           this.searchProducts();
        },
        '$route'(route){
            this.currentPage = route.query.page ? route.query.page : 1;
            this.setProducts();
        }
    },
    computed : {
        ...Vuex.mapGetters({
            getProducts : 'getProducts',
            cart : 'cart',
            getModalMsg : 'modalMsg',
            getIndex : 'getIndex'
        }),
    },
    methods : {
        setProducts(){
            this.products = this.filter([... this.getProducts.reverse()]);
            this.getProducts.reverse();
        },
        searchProducts(){
            event.preventDefault();
            if(this.searchInput){
                this.isSearch = true;
                let products = db.select(['*']).from(['products']).where('name').like(this.searchInput, true);
                this.products = this.filter([... products.reverse()]);
            } else {
                this.isSearch = false;
                this.setProducts();
            }
        },
        outOfStock(productIndex){
            return this.products[productIndex].stock > 0 ? false : true;
        },
        addToCart(event){
            let productId = Number(event.currentTarget.dataset.pid);
            let product = db.select(['*']).from('products').where(['id', '=', productId])[0];
            let cart = db.select(['*']).from('cart').where(['productId', '=', productId])[0];
            let cartIsEmpty = cart ? Object.keys(cart).length : cart;
            let isValidProduct = product ? !!Object.keys(product).length : false;
            if( isValidProduct ){
                if(Number(product.quantity) > product.stock){
                    this.showModal('Quantity should not be greater than stock');
                    return;
                }
                if(Number(product.quantity) < 1){
                    this.showModal('Quantity should not be lesser than one');
                    return;
                }
                if( !cartIsEmpty ){
                    try{
                        product.productId = productId;
                        product.quantity = Number(product.quantity);
                        let result = db.insert('cart', {
                            productId : product.id,
                            quantity : product.quantity
                        });
                        this.showModal('Item Added To Cart');
                        if( result.lastInsertId ){
                            db.update('products').where(['id', '=',  productId]).values({
                                stock : product.stock - Number(product.quantity),
                            });
                            this.$store.commit('updateStore');
                        }
                    } catch(e) {
                        this.showModal("Can't Add To Cart :  " + e.message);
                    }
                } else {
                    try{
                        db.update('cart').where(['productId', '=',  productId]).values({
                            quantity : ((cart ? cart.quantity : 1) + Number(product.quantity)),
                        });
                        db.update('products').where(['id', '=',  productId]).values({
                            stock : product.stock - Number(product.quantity),
                        });
                        this.showModal('Item Added To Cart');
                        this.$store.commit('updateStore');
                    } catch(e) {
                        this.showModal("Can't Add To Cart :  " + e.message);
                    }
                }
            } else {
                this.showModal('Invalid product');
            }
        },
        dismissModal(){
            this.$store.dispatch('dismissModal', {
                vm : this.$root
            });
        },
        showModal(modalMsg){
            this.$store.dispatch('showModal', {
                modalMsg,
                vm : this.$root
            });
        },
    },
    template :  `
        <section class="main-content">
            <div class="search-panel">
                <div>
                    <h3> Products </h3>
                </div>
                <div>
                    <form>
                        <input type="text" placeholder="search products" v-model="searchInput">
                        <input type="submit" value="search">
                    </form>
                </div>
            </div>
           
            <div v-if="products.length" class="products-cont" align="center">
                <div v-for="(product, i) in products" class="product-item">
                <div class="product-img" :style="'background-image:url(' + product.image + ')'">
                    <div align="right" class="row-pad">
                        <div class="stock-cont" title="stock" align="right">
                            {{product.stock}}
                        </div>
                    </div>
                </div>
                <div class="row-pad">
                    <strong> {{product.name}} </strong>
                </div>
                <div class="row-pad" align="center">
                    price - 
                    <strong class="product-price">
                        {{product.price ? '$' + product.price * (product.quantity < 1 ? 1 : product.quantity) : 'free'}}
                    </strong>
                </div>
                    Qty <input v-model="product.quantity" type="number" min="1" v-bind:max="product.stock">
                    <br>
                <div class="row-pad">
                    <button :disabled="outOfStock(i)" class="btn cart-btn" v-on:click="addToCart" v-bind:data-pid="product.id" v-bind:data-id="i">
                        {{outOfStock(i) ? 'out of stock' : 'add to cart'}}
                    </button>
                </div>
            </div>
            </div>
            <div v-else class="content-center" align="center" style="min-height:50vh">
                {{isSearch ? 'No Item Found' : 'No Products Yet'}}
            </div>
            <div style="padding: 0px 30px; flex-direction:row; display:flex; justify-content: space-between; align-items: center; flex-wrap: wrap; border-radius: 5px;">
                <div class="w-100">
                    <ul v-if="pages('getProducts').length" class="pagination">
                        <li v-for="i in pages('getProducts')"  class="pagination-item">
                            <router-link :to="'?page=' + i" tag="a" class="pagination-link" :disabled="currentPage == i ? true : false" :data-id="i" :class="currentPage == i ? 'active' : ''">
                            {{i}}
                            </router-link>
                        </li>
                    </ul>
                </div>
            </div>
            <br>
        </section>
   `
};