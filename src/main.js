/**
 * Расчёт прибыли от одной покупки
 */
function calculateSimpleRevenue(purchase, _product) {
    const discountFactor = 1 - (purchase.discount || 0) / 100;
    return (purchase.sale_price || 0) * (purchase.quantity || 0) * discountFactor;
}

/**
 * Расчёт бонуса в зависимости от позиции продавца
 */
function calculateBonusByProfit(index, total, seller) {
    const { profit } = seller;
    if (index === 0) return profit * 0.15;
    if (index === 1 || index === 2) return profit * 0.10;
    if (index === total - 1) return 0;
    return profit * 0.05;
}

/**
 * Анализ данных продаж с двойным циклом по чекам и товарам
 */
function analyzeSalesData(data, options) {
    const { calculateRevenue, calculateBonus } = options;

    if (!calculateRevenue || !calculateBonus) throw new Error("Необходимо передать функции calculateRevenue и calculateBonus");

   if (!data
        || !Array.isArray(data.sellers) || data.sellers.length === 0
        || !Array.isArray(data.products) || data.products.length === 0
        || !Array.isArray(data.purchase_records) || data.purchase_records.length === 0
    ) {
        throw new Error('Некорректные входные данные');
    }

    // Проверяем, что options — это объект и что внутри есть необходимые функции
    if (!options || typeof options !== "object") {
        throw new Error("Необходимо передать объект с опциями");
    }

    if (typeof calculateRevenue !== "function" || typeof calculateBonus !== "function") {
        throw new Error("Опции должны содержать функции calculateRevenue и calculateBonus");
    }

    // Подготовка промежуточной статистики продавцов
    const sellerStats = data.sellers.map(seller => ({
        seller_id: seller.id,
        name: `${seller.first_name} ${seller.last_name}`,
        revenue: 0,
        profit: 0,
        sales_count: 0,
        products_sold: {} // sku -> количество
    }));

    // Индекс продавцов и товаров для быстрого доступа
    const sellerIndex = {};
    data.sellers.forEach(s => {
        sellerIndex[s.id] = {
            seller_id: s.id,
            name: `${s.first_name} ${s.last_name}`,
            revenue: 0,
            profit: 0,
            sales_count: 0,
            products_sold: {} // sku -> количество
        };
    });

    const productIndex = Object.fromEntries(data.products.map(p => [p.sku, p]));
    

    // Основной цикл: по всем чекам
    data.purchase_records.forEach(record => {
        const seller = sellerIndex[record.seller_id];
        if (!seller) return;

        // Увеличиваем количество продаж и суммарную выручку по чеку
        seller.sales_count += 1;
        seller.revenue += record.total_amount;

        // Второй цикл: по всем товарам в чеке
        record.items.forEach(item => {
            const product = productIndex[item.sku];
            if (!product) return;

            // Себестоимость товара
            const cost = product.purchase_price * item.quantity;

            // Выручка с учётом скидки
            const revenue = calculateRevenue(item, product);

            // Прибыль: выручка минус себестоимость
            const profit = revenue - cost;

            seller.profit += profit;

            // Увеличиваем количество проданных товаров
            if (!seller.products_sold[item.sku]) {
                seller.products_sold[item.sku] = 0;
            }
            seller.products_sold[item.sku] += item.quantity;
        });
    });

    // Сортировка продавцов по прибыли
    const sellersArray = Object.values(sellerIndex).sort((a, b) => b.profit - a.profit);

    // Формируем итоговый отчёт с округлением
    return sellersArray.map((seller, index, arr) => {
        const top_products = Object.entries(seller.products_sold)
            .map(([sku, quantity]) => ({ sku, quantity }))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 10);

        return {
            seller_id: seller.seller_id,
            name: seller.name,
            revenue: +seller.revenue.toFixed(2),
            profit: +seller.profit.toFixed(2),
            sales_count: seller.sales_count,
            top_products,
            bonus: +calculateBonus(index, arr.length, seller).toFixed(2)
        };
    });
}


