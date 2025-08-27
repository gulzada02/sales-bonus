/**
 * Расчёт прибыли от одной покупки
 */
function calculateSimpleRevenue(purchase, _product) {
    const { discount, sale_price, quantity } = purchase;
    const discountFactor = 1 - discount / 100;
    return sale_price * quantity * discountFactor;
}

/**
 * Расчёт бонуса в зависимости от позиции продавца
 */
function calculateBonusByProfit(index, total, seller) {
    const { profit } = seller;
    if (index === 0) return profit * 0.15;          // 15% для 1-го места
    if (index === 1 || index === 2) return profit * 0.10; // 10% для 2-го и 3-го
    if (index === total - 1) return 0;             // 0% для последнего
    return profit * 0.05;                          // 5% для остальных
}

/**
 * Анализ данных продаж и формирование отчёта
 */
function analyzeSalesData(data, options) {
    const { calculateRevenue, calculateBonus } = options;

    // Создаём карту продавцов
    const sellersMap = {};
    data.sellers.forEach(seller => {
        sellersMap[seller.id] = {
            seller_id: seller.id,
            name: `${seller.first_name} ${seller.last_name}`,
            revenue: 0,
            profit: 0,
            sales_count: 0,
            products: {} // sku -> количество
        };
    });

    // Индекс товаров
    const productsMap = Object.fromEntries(data.products.map(p => [p.sku, p]));

    // Обрабатываем покупки
    data.purchase_records.forEach(purchase => {
        const seller = sellersMap[purchase.seller_id];
        const product = productsMap[purchase.product_sku];
        if (!seller || !product) return;

        const revenue = calculateRevenue(purchase, product);

        seller.revenue += revenue;
        seller.profit += revenue;
        seller.sales_count += purchase.quantity;

        seller.products[product.sku] = (seller.products[product.sku] || 0) + purchase.quantity;
    });

    // Массив продавцов, отсортированный по прибыли
    const sellersArray = Object.values(sellersMap).sort((a, b) => b.profit - a.profit);

    // Формируем итоговый отчёт
    return sellersArray.map((seller, index, arr) => {
        const top_products = Object.entries(seller.products)
            .map(([sku, quantity]) => ({ sku, quantity }))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 10);

        return {
            seller_id: seller.seller_id,
            name: seller.name,
            revenue: Math.round(seller.revenue),
            profit: Math.round(seller.profit),
            sales_count: seller.sales_count,
            top_products,
            bonus: Math.round(calculateBonus(index, arr.length, seller))
        };
    });
}

