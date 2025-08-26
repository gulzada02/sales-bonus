/**
 * Функция для расчета прибыли
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
   // @TODO: Расчет прибыли от операции

   const {discount, sale_price, quantity}=purchase;
   const discountFactror=1-(discount/100);
   return sale_price*quantity*discountFactror;
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    // @TODO: Расчет бонуса от позиции в рейтинге

       const { profit } = seller;

    if (index === 0) return profit * 0.15; // 15% для 1-го места
    if (index === 1 || index === 2) return profit * 0.10; // 10% для 2-го и 3-го
    if (index === total - 1) return 0; // 0% для последнего
    return profit * 0.05; // 5% для остальных
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {

    // @TODO: Проверка входных данных

    if (!data
        || !Array.isArray(data.sellers)
        || !Array.isArray(data.products)
        || !Array.isArray(data.purchases)
        || data.sellers.length === 0
        || data.products.length === 0
        || data.purchases.length === 0
    ) {
        throw new Error('Некорректные входные данные');
    }

    if (!options 
        || typeof options.calculateRevenue !== "function" 
        || typeof options.calculateBonus !== "function"
    ) {
        throw new Error("Необходимо передать функции calculateRevenue и calculateBonus");
    }


    if (!Array.isArray(data) || data.length === 0) {
        return [];
    }



    // @TODO: Проверка наличия опций
    const { calculateRevenue, calculateBonus } = options; 

     if (!options || typeof options.calculateRevenue !== "function" || typeof options.calculateBonus !== "function") {
        throw new Error("Необходимо передать функции calculateRevenue и calculateBonus");
    }

     if (typeof options !== "object" || options === null) {
        throw new Error("Опции должны быть объектом");
    }
    // @TODO: Подготовка промежуточных данных для сбора статистики

    const sellerStats = data.sellers.map(seller => ({
    seller_id: seller.id,                      
    name: `${seller.first_name} ${seller.last_name}`, 
    revenue: 0,                                 
    profit: 0,                                 
    sales_count: 0,                            
    products_sold: {}                           
}));

    const sellersMap = {};

    data.forEach(purchase => {
        const { seller_id, seller_name, product, quantity } = purchase;
        if (!sellersMap[seller_id]) {
            sellersMap[seller_id] = {
                seller_id,
                name: seller_name,
                revenue: 0,
                profit: 0,
                sales_count: 0,
                products: {}
            };
    }


    // @TODO: Индексация продавцов и товаров для быстрого доступа

    const sellerIndex = Object.fromEntries(
    sellerStats.map(seller => [seller.seller_id, seller])
);

const productIndex = Object.fromEntries(
    data.products.map(product => [product.sku, product])
);

    // @TODO: Расчет выручки и прибыли для каждого продавца
     const seller = sellersMap[seller_id];
        const revenue = calculateRevenue(purchase, product);

        seller.revenue += revenue;
        seller.profit += revenue;
        seller.sales_count += 1;
        seller.products[product.sku] = (seller.products[product.sku] || 0) + quantity;
    });

    // @TODO: Сортировка продавцов по прибыли
        const sellersArray = Object.values(sellersMap).sort((a, b) => b.profit - a.profit);


    // @TODO: Назначение премий на основе ранжирования
    sellersArray = sellersArray.map((seller, index, arr) => {
        const top_products = Object.entries(seller.products)
            .map(([sku, quantity]) => ({ sku, quantity }))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 10);

        return {
            seller_id: seller.seller_id,
            name: seller.name,
            revenue: seller.revenue,
            profit: seller.profit,
            sales_count: seller.sales_count,
            top_products,
            bonus: calculateBonus(index, arr.length, seller)
        };
    });


    // @TODO: Подготовка итоговой коллекции с нужными полями
        return sellersArray;

}

const result = analyzeSalesData(salesData, {
    calculateRevenue: calculateSimpleRevenue,
    calculateBonus: calculateBonusByProfit
});

const finalReport = sellerStats.map((seller, index, arr) => {
    // Топ-10 проданных товаров
    const top_products = Object.entries(seller.products_sold)
        .map(([sku, quantity]) => ({ sku, quantity }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10);

    return {
        seller_id: seller.seller_id,
        name: seller.name,
        revenue: +seller.revenue.toFixed(2),  // два знака после точки
        profit: +seller.profit.toFixed(2),    // два знака после точки
        sales_count: seller.sales_count,      // целое число
        top_products,
        bonus: +calculateBonus(index, arr.length, seller).toFixed(2) // бонус с двумя знаками
    };
});


/** Результат работы главной функции — коллекция данных о продавцах таком формате:
 * 
[{
    seller_id: "seller_1", // Идентификатор продавца
        name: "Alexey Petrov", // Имя и фамилия продавца
        revenue: 123456, // Общая выручка с учётом скидок
        profit: 12345, // Прибыль от продаж продавца
        sales_count: 20, // Количество продаж
        top_products: [{ // Топ-10 проданных товаров в штуках
        sku: "SKU_001", // Артикул товара
        quantity: 12: // Сколько продано
    }],
        bonus: 1234 // Итоговый бонус в рублях, не процент
}]  
        */