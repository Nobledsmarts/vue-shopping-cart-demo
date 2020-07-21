const home = {
    mixins : [homeView, util],
}
const admin = {
    mixins : [adminView, util],
}

const cart = {
    mixins : [cartView, util],
}

const routes = [
    {
        path : '/', component : home,
    },
    {
        path : '/admin', component : admin,
    },
    {
        path : '/cart', component : cart,
    }
];
