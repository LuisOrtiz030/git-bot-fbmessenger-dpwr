const { router, messenger } = require('bottender/router');
const WooCommerceAPI = require('woocommerce-api');



const WooCommerce = new WooCommerceAPI({
    url: 'http://localhost:8888/dbpwr/',
    consumerKey: process.env.WOOCOMERCE_CONSUMER_KEY,
    consumerSecret: process.env.WOOCOMERCE_CONSUMER_SECRET,
    version: 'v3'
});




module.exports = async function App(context) {

    if (context.event.payload == "PRODUCTOS_MENU") {

        WooCommerce.getAsync('products').then(async function(result) {
            var data = JSON.parse(result.toJSON().body);

            //console.log(data)

            var arreglo_nombres = [];

            for (var i = 0; i < data.products.length; i++) {
                var e_descripcion = data.products[i].short_description;
                let init = e_descripcion.indexOf("<p>");
                let end = e_descripcion.indexOf("</p>");
                let value = e_descripcion.substring((init + 3), (end - init));
                var e_title = data.products[i].title
                var e_price = data.products[i].price
                var e_link = data.products[i].permalink
                let template_generic = {
                    title: `${e_title}`,
                    imageUrl: 'https://scontent-dfw5-1.xx.fbcdn.net/v/t1.0-9/p960x960/91940806_3186059658079543_81202833541562368_o.jpg?_nc_cat=1&_nc_sid=85a577&_nc_ohc=rT0RjQz7WYEAX-dOVTe&_nc_ht=scontent-dfw5-1.xx&_nc_tp=6&oh=760f1ce5702bcf59b6be9574c56042e1&oe=5EBB3767',
                    subtitle: `${"$"}${e_price}\n${value}\n`,
                    buttons: [{
                        type: 'web_url',
                        url: e_link,
                        title: 'Ver en tienda'
                    }, ],
                }
                arreglo_nombres.push(template_generic)
            }
            await context.sendGenericTemplate(arreglo_nombres)
        });
    }


    if (context.event.payload == "ESTATUS_MENU") {

        const rastreo = context.state.rastreo;

        context.setState({
            rastreo,
        });

        context.setState({ rastreo: true })

        await context.sendText(`> State > ${context.state.rastreo}`)

        await context.sendText(`> Pregunta > ${ "Comparte tu número de pedido:" } `)
    }

    if (context.state.rastreo && context.event.isText) {

        await context.sendText(`> State > ${context.state.rastreo}`)

        context.setState({ rastreo: false })

        context.setState({ enviar_numero: true })

        await context.sendText(`> Rastreo > ${context.state.rastreo}`)

        let regex = /[^0-9]/g;

        let numero = context.event.text.replace(regex, "")

        if (numero.length == 0) {

            await context.sendText(`No se compartió ningún número. Por favor comparte el ID de tu pedido`)


        }

        WooCommerce.getAsync(`orders/${numero}`).then(async function(result) {

            var data = JSON.parse(result.toJSON().body);

            console.log(data)

            if (data.hasOwnProperty('errors')) {

                await context.sendText(`No se encontraron ordenes con el ID igual a ${numero}, favor de revisarlo.`);

            }
            if (data.hasOwnProperty('order')) {

                let status_pedido = data.order.status


                var estatus = "";
                switch (status_pedido) {
                    case "pending-payment":
                        estatus = "Pago pendiente";
                        break;
                    case "failed":
                        estatus = "Pago fallido";
                        break;
                    case "processing":
                        estatus = "Procesando";
                        break;
                    case "on-hold":
                        estatus = "Pago en espera";
                        break;
                    case "completed":
                        estatus = "Pedido Completado";
                        break;
                    case "canceled":
                        estatus = "Pedido Cancelado";
                        break;
                    case "refunded":
                        estatus = "Pedido Reembolsado"
                        break;
                    case "authentication-required":
                        estatus = "Autenticación requerida"
                        break;
                    default:
                        estatus = "Pedido incorrecto. Revisa el número de pedido. "
                        break;
                }

                await context.sendText(`> Nombre comprador:  > ${data.order.billing_address.first_name} ${data.order.billing_address.last_name}`)
                await context.sendText(`> Estatus  > ${estatus}`)
            }
        })

    }

};