const cartView = {
    data(){
        return {
            products : [],
            searchInput : "",
            isSearch : false,
            currentPage : 1,
        }
    },
    created(){
        document.title = "simple shopping - Cart";
        this.currentPage = Object.keys(this.$route.query).length ? this.$route.query.page : 1;
        this.setProducts();
        db.addEventListener('tabupdate', () => {
            this.$store.commit('updateStore');
            this.setProducts();
        });
    },
    computed : {
        ...Vuex.mapGetters({
            getProducts : 'getProducts',
            getProduct : 'getProduct',
            cart : 'cart',
            getModalMsg : 'modalMsg'
        }),
    },
    watch :{
        searchInput() {
           this.searchCart();
        },
        '$route'(route){
            this.currentPage = route.query.page;
            this.setProducts();
        }
    },
    methods : {
        ...Vuex.mapActions({
            getProduct : 'getProduct'
        }),
        setProducts(){
            this.products = this.filter([... this.cart.reverse()]);
            this.cart.reverse();
        },
        dismissModal(){
            this.$store.dispatch('dismissModal', {
                vm : this.$root
            });
        },
        triggerRemoveAll(){
            let msg = "remove all products from cart?";
            this.triggerRemove(msg, true);
        },
        triggerRemove(msg, isRemoveAll){
            window._that = this;
            let productId = event.currentTarget.dataset.pid;
            this.showModal(`
            ${isRemoveAll ?  msg : 'Remove product?'}
            <div class="modal-cta" align="center">
                <button onclick="cartView.methods${isRemoveAll ? ".removeAll" : ".removeProduct"}(${productId});" class="btn"> remove </button> 
                <button onclick="cartView.methods.triggerCancel()" class="btn"> cancel </button>
            </div> 
            `);
        },
        showModal(modalMsg){
            this.$store.dispatch('showModal', {
                modalMsg,
                vm : this.$root
            });
        },
        searchCart(){
            event.preventDefault();
            if(this.searchInput){
                this.isSearch = true;
                let products = db.select(['*']).from(['cart']).where('name').like(this.searchInput, true);
                this.products = this.filter([... products.reverse()]);
            } else {
                this.isSearch = false;
                this.setProducts();
            }
        },
        removeAll(){
            this.removeProduct(false, true)
        },
        removeProduct(productId, isRemoveAll){
            let that = window._that;
            that.dismissModal();
            if(!isRemoveAll){
                let del = db.delete('cart').where(['id', '=',  productId])[0];
                let product = (db.select(['*']).from('products').where(['productId', '=', del.productId]))[0];
                db.update('products').where(['id', '=', del.productId]).values({
                    stock : (product.stock + del.quantity)
                })
                that.$store.commit('updateStore');
                del && that.showModal('product has been deleted');
            } else {
                let cart = db.select(['*']).from('cart');
                cart.forEach((productObj) => {
                    let del = db.delete('cart').where(['id', '=',  productObj.id])[0];
                    let product = (db.select(['*']).from('products').where(['productId', '=', productObj.productId]))[0];
                    db.update('products').where(['id', '=', del.productId]).values({
                        stock : (product.stock + del.quantity)
                    })
                    that.$store.commit('updateStore');
                });
                that.showModal('products has been deleted');
            }
            that.setProducts();
            window._that = undefined;
        },
        triggerCancel(){
            let that = window._that;
            that.dismissModal();
            window._that = undefined;
        },
    },
    template : `
        <section class="main-content">
            <div class="search-panel">
            <div style="display: flex;">
                    <h3> Cart - ({{cart.length}})</h3> 
                    <div v-if="cart.length > 1" class="content-center" style="margin : 0px 20px">
                        <button class="btn btn-remove" v-on:click="triggerRemoveAll">
                            remove all
                        </button>
                    </div>  
                </div> 
                <div>
                    <form v-on:submit="searchCart">
                        <input type="text" placeholder="search cart" v-model="searchInput">
                        <input type="submit" value="search">
                    </form>
                </div>
            </div>
            <div v-if="products.length" class="products-cont" align="center">
                <div v-for="(product, i) in products" class="product-item">
                <div class="product-img" :style="'background-image:url(' + getProduct('products', product.productId).image + ')'">
                    <div align="right" class="row-pad">
                        <div class="stock-cont" title="quantity" align="right">
                            {{product.quantity}}
                        </div>
                    </div>
                </div>
                <div class="row-pad">
                    <strong> {{getProduct('products', product.productId).name}} </strong>
                </div>
                    total Price : <strong class="product-price">
                    {{product.price ? '$' + product.price * product.quantity : 'free'}}
                    </strong>
                    <br>
                <div class="row-pad">
                    <button class="btn cart-btn" v-on:click="triggerRemove" v-bind:data-pid="product.id" v-bind:data-id="i">
                        remove from Cart
                    </button>
                </div>
            </div>
            </div>
            <div v-else class="content-center" align="center" style="min-height:50vh">
                {{isSearch ? 'No Item Found' : 'You dont have any item in your cart'}}
            </div>
            <div style="padding: 0px 30px; flex-direction:row; display:flex; justify-content: space-between; align-items: center; flex-wrap: wrap; border-radius: 5px;">
                <div class="w-100">
                    <ul v-if="pages('cart').length" class="pagination">
                        <li v-for="i in pages('cart')"  class="pagination-item">
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
}