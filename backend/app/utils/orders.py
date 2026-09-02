from app.db.models import Order, Insight
from app.utils.enums import COMPLETED_STATUSES, PREORDER_STATUSES, UNPROCESSED_STATUSES, TRAFFIC_DEFAULT_INVENTORY, TRAFFIC_DEFAULT_KPI_PERCENTAGE, TRAFFIC_APPROVE_STATUSES
from app.utils.misc import get_order_site_type, get_insight_site_type, get_offer_percentage_rate, normalize_offer_id


def calculate_price_indicators(spend: float, approves_count: int, avg_check_usd: float, kpi_percentage: float) -> dict:
    """
    price_fact — фактическая цена апрува (спенд / апрувы), None если апрувов нет;
    price_max — максимально допустимая цена апрува (сред. чек $ * KPI оффера, по умолчанию 25%);
    minus — перерасход: (max - fact) * апрувы, если fact превышает max;
            если апрувов нет, но есть спенд — в минус попадает весь спенд.
    """
    price_max = avg_check_usd * kpi_percentage

    if approves_count:
        price_fact = spend / approves_count
        minus = (price_max - price_fact) * approves_count if price_fact > price_max else 0

    else:
        price_fact = None
        minus = -spend if spend else 0

    return {
        "price_fact": price_fact,
        "price_max": price_max,
        "minus": minus,
    }


async def orders_stats(result: dict, orders: list[Order], name: str, trello_data: dict, inventories_data: dict, approve_statuses: list):
    for order in orders:
        is_approve = True if order.status in approve_statuses else False
        site_type = get_order_site_type(order.method)

        if not result.get(order.offer_id):
            result[order.offer_id] = {}

        if not result[order.offer_id].get(order.buyer_id):
            result[order.offer_id][order.buyer_id] = {}

        if not result.get(order.offer_id)[order.buyer_id].get(site_type):
            offer_id = normalize_offer_id(order.offer_id)

            try:
                int(offer_id.split('-')[2].replace('$', ''))
                flow_type = "Оффер"

                if trello_data.get(offer_id):
                    offer_name = trello_data.get(offer_id)['name']

                else:
                    offer_name = offer_id

            except (ValueError, IndexError):
                flow_type = "Каталог"
                offer_name = offer_id

            if trello_data.get(offer_id):
                column_name = trello_data.get(offer_id)['column']
                card_url = trello_data.get(offer_id)['url']

            else:
                column_name = ""
                card_url = ""

            result[order.offer_id][order.buyer_id][site_type] = {
                'offer_id': order.offer_id,
                'flow_type': flow_type,
                'buyer_id': order.buyer_id,
                'type': order.type,
                'offer_type': "Дорогой" if order.type == "dorogie-tovary" else "Обычный",
                'name': offer_name,
                'column': column_name,
                'url': card_url,
                'inventory': inventories_data.get(offer_id, dict(TRAFFIC_DEFAULT_INVENTORY)),
                'has_out_of_stock': True if 0 in [item.get('quantity', 0) for item in inventories_data.get(offer_id, {}).get('offers', {}).values()] else False,
                'first': {
                    "all_count": 0,
                    "clean_count": 0,
                    "unprocessed_count": 0,
                    "approves_count": 0,
                    "approves_median_count": 0,
                    "trash_count": 0,
                    "preorder_count": 0,
                    "completed_count": 0,
                    "approves_sum": 0,
                    "approves_median_sum": 0,
                    "spend": 0,
                    "conversion": 0
                },
                'second': {
                    "all_count": 0,
                    "clean_count": 0,
                    "unprocessed_count": 0,
                    "approves_count": 0,
                    "approves_median_count": 0,
                    "trash_count": 0,
                    "preorder_count": 0,
                    "completed_count": 0,
                    "approves_sum": 0,
                    "approves_median_sum": 0,
                    "spend": 0,
                    "conversion": 0
                },
                'third': {
                    "all_count": 0,
                    "clean_count": 0,
                    "unprocessed_count": 0,
                    "approves_count": 0,
                    "approves_median_count": 0,
                    "trash_count": 0,
                    "preorder_count": 0,
                    "completed_count": 0,
                    "approves_sum": 0,
                    "approves_median_sum": 0,
                    "spend": 0,
                    "conversion": 0
                }
            }

        result[order.offer_id][order.buyer_id][site_type][name]["all_count"] += 1
        if order.status not in ('testy', 'trash', 'duplicate'):
            result[order.offer_id][order.buyer_id][site_type][name]["clean_count"] += 1
        if order.status in UNPROCESSED_STATUSES:
            result[order.offer_id][order.buyer_id][site_type][name]["unprocessed_count"] += 1
        if is_approve:
            result[order.offer_id][order.buyer_id][site_type][name]["approves_count"] += 1
            result[order.offer_id][order.buyer_id][site_type][name]["approves_sum"] += float(order.price_clear_old)
            if order.price_clear_old >= 90:
                result[order.offer_id][order.buyer_id][site_type][name]["approves_median_count"] += 1
                result[order.offer_id][order.buyer_id][site_type][name]["approves_median_sum"] += float(order.price_clear_old) if order.price_clear_old < 500 else 500
        result[order.offer_id][order.buyer_id][site_type][name]["trash_count"] += 1 if order.status == 'trash' else 0
        result[order.offer_id][order.buyer_id][site_type][name]["preorder_count"] += 1 if order.status in PREORDER_STATUSES else 0
        result[order.offer_id][order.buyer_id][site_type][name]["completed_count"] += 1 if order.status in COMPLETED_STATUSES else 0

async def test_orders_stats(result: dict, orders: list[Order], name: str, trello_data: dict, inventories_data: dict):
    for order in orders:
        is_approve = True if order.status in PREORDER_STATUSES else False
        site_type = get_order_site_type(order.method)

        if not result.get(order.offer_id):
            result[order.offer_id] = {}

        if not result[order.offer_id].get(order.buyer_id):
            result[order.offer_id][order.buyer_id] = {}

        if not result.get(order.offer_id)[order.buyer_id].get(site_type):
            if order.offer_id.count('-') == 2:
                offer_id = order.offer_id

            else:
                offer_id = order.offer_id.rsplit("-", 1)[0]

            try:
                int(offer_id.split('-')[2].replace('$', ''))
                flow_type = "Оффер"

                if trello_data.get(offer_id):
                    offer_name = trello_data.get(offer_id)['name']

                else:
                    offer_name = offer_id

            except (ValueError, IndexError):
                flow_type = "Каталог"
                offer_name = offer_id

            if trello_data.get(offer_id):
                column_name = trello_data.get(offer_id)['column']
                card_url = trello_data.get(offer_id)['url']

            else:
                column_name = ""
                card_url = ""

            result[order.offer_id][order.buyer_id][site_type] = {
                'offer_id': order.offer_id,
                'flow_type': flow_type,
                'buyer_id': order.buyer_id,
                'type': order.type,
                'offer_type': "Дорогой" if order.type == "dorogie-tovary" else "Обычный",
                'name': offer_name,
                'column': column_name,
                'url': card_url,
                'inventory': inventories_data.get(offer_id, {'quantity': 0, 'offers': []}),
                'has_out_of_stock': True if 0 in [item.get('quantity', 0) for item in inventories_data.get(offer_id, {}).get('offers', {}).values()] else False,
                'first': {
                    "all_count": 0,
                    "clean_count": 0,
                    "unprocessed_count": 0,
                    "approves_count": 0,
                    "approves_median_count": 0,
                    "trash_count": 0,
                    "preorder_count": 0,
                    "completed_count": 0,
                    "approves_sum": 0,
                    "approves_median_sum": 0,
                    "spend": 0,
                    "conversion": 0
                },
                'second': {
                    "all_count": 0,
                    "clean_count": 0,
                    "unprocessed_count": 0,
                    "approves_count": 0,
                    "approves_median_count": 0,
                    "trash_count": 0,
                    "preorder_count": 0,
                    "completed_count": 0,
                    "approves_sum": 0,
                    "approves_median_sum": 0,
                    "spend": 0,
                    "conversion": 0
                },
                'third': {
                    "all_count": 0,
                    "clean_count": 0,
                    "unprocessed_count": 0,
                    "approves_count": 0,
                    "approves_median_count": 0,
                    "trash_count": 0,
                    "preorder_count": 0,
                    "completed_count": 0,
                    "approves_sum": 0,
                    "approves_median_sum": 0,
                    "spend": 0,
                    "conversion": 0
                }
            }

        result[order.offer_id][order.buyer_id][site_type][name]["all_count"] += 1
        if order.status not in ('testy', 'trash', 'duplicate'):
            result[order.offer_id][order.buyer_id][site_type][name]["clean_count"] += 1
        if order.status in UNPROCESSED_STATUSES:
            result[order.offer_id][order.buyer_id][site_type][name]["unprocessed_count"] += 1
        if is_approve:
            result[order.offer_id][order.buyer_id][site_type][name]["approves_count"] += 1
            result[order.offer_id][order.buyer_id][site_type][name]["approves_sum"] += float(order.price_clear_old)
            if order.price_clear_old >= 90:
                result[order.offer_id][order.buyer_id][site_type][name]["approves_median_count"] += 1
                result[order.offer_id][order.buyer_id][site_type][name]["approves_median_sum"] += float(order.price_clear_old) if order.price_clear_old < 500 else 500
        result[order.offer_id][order.buyer_id][site_type][name]["trash_count"] += 1 if order.status == 'trash' else 0
        result[order.offer_id][order.buyer_id][site_type][name]["completed_count"] += 1 if order.status in COMPLETED_STATUSES else 0


async def insights_stats(result: dict, insights: list[Insight], name: str):
    for insight in insights:
        site_type = get_insight_site_type(insight.type)

        if not result.get(insight.offer_id):
            result[insight.offer_id] = {}

        if not result[insight.offer_id].get(insight.buyer_id):
            result[insight.offer_id][insight.buyer_id] = {}

        if not result[insight.offer_id][insight.buyer_id].get(site_type):
            result[insight.offer_id][insight.buyer_id][site_type] = {
                'first': {
                    'spend': 0,
                    'conversion': 0,
                    'link_clicks': 0,
                },
                'second': {
                    'spend': 0,
                    'conversion': 0,
                    'link_clicks': 0,
                },
                'third': {
                    'spend': 0,
                    'conversion': 0,
                    'link_clicks': 0,
                },
            }

        result[insight.offer_id][insight.buyer_id][site_type][name]['spend'] += float(insight.spend)
        result[insight.offer_id][insight.buyer_id][site_type][name]['conversion'] += insight.conversion
        result[insight.offer_id][insight.buyer_id][site_type][name]['link_clicks'] += insight.link_clicks


async def generate_offer_data(orders: list[Order], insights: list[Insight], sum_usd_rate: float):
    preparing = {}
    result = []

    for order in orders:
        medium = order.medium if order.medium else 'empty'
        campaign = order.campaign if order.campaign else 'empty'
        keyword = order.keyword if order.keyword else 'empty'
        content = order.content if order.content else 'empty'

        if not preparing.get(medium):
            preparing[medium] = {}

        if not preparing[medium].get(campaign):
            preparing[medium][campaign] = {}

        if not preparing[medium][campaign].get(keyword):
            preparing[medium][campaign][keyword] = {}

        if not preparing[medium][campaign][keyword].get(content):
            preparing[medium][campaign][keyword][content] = {
                'status': ' ',
                'spend': 0,
                'conversion': 0,
                'orders': 0,
                'clean_orders': 0,
                'unprocessed': 0,
                'price': 0,
                'price_median': 0,
                'approves': 0,
                'approves_median': 0,
                'trash': 0,
                'preorder': 0,
                'completed': 0
            }

        preparing[medium][campaign][keyword][content]['orders'] += 1

        if order.status not in ('testy', 'trash', 'duplicate'):
            preparing[medium][campaign][keyword][content]['clean_orders'] += 1

        if order.status in TRAFFIC_APPROVE_STATUSES:
            preparing[medium][campaign][keyword][content]['approves'] += 1
            preparing[medium][campaign][keyword][content]['price'] += float(order.price_clear_old)
            if order.price_clear_old >= 90:
                preparing[medium][campaign][keyword][content]["approves_median"] += 1
                preparing[medium][campaign][keyword][content]["price_median"] += float(order.price_clear_old) if order.price_clear_old < 500 else 500

        if order.status in UNPROCESSED_STATUSES:
            preparing[medium][campaign][keyword][content]['unprocessed'] += 1

        if order.status == 'trash':
            preparing[medium][campaign][keyword][content]['trash'] += 1

        if order.status in PREORDER_STATUSES:
            preparing[medium][campaign][keyword][content]['preorder'] += 1

        if order.status in COMPLETED_STATUSES:
            preparing[medium][campaign][keyword][content]['completed'] += 1

    for insight in insights:
        medium = insight.medium if insight.medium else 'empty'
        campaign = insight.campaign if insight.campaign else 'empty'
        keyword = insight.keyword if insight.keyword else 'empty'
        content = insight.content if insight.content else 'empty'

        if not preparing.get(medium):
            preparing[medium] = {}

        if not preparing[medium].get(campaign):
            preparing[medium][campaign] = {}

        if not preparing[medium][campaign].get(keyword):
            preparing[medium][campaign][keyword] = {}

        if not preparing[medium][campaign][keyword].get(content):
            preparing[medium][campaign][keyword][content] = {
                'status': ' ',
                'spend': 0,
                'conversion': 0,
                'orders': 0,
                'clean_orders': 0,
                'unprocessed': 0,
                'price': 0,
                'price_median': 0,
                'approves': 0,
                'approves_median': 0,
                'trash': 0,
                'preorder': 0,
                'completed': 0
            }

        preparing[medium][campaign][keyword][content]['status'] = '🚫'
        preparing[medium][campaign][keyword][content]['spend'] += float(insight.spend)
        preparing[medium][campaign][keyword][content]['conversion'] += insight.conversion

    for medium in preparing.keys():
        for campaign in preparing[medium].keys():
            for keyword in preparing[medium][campaign].keys():
                for content in preparing[medium][campaign][keyword].keys():
                    percent_approve = round(preparing[medium][campaign][keyword][content]['approves'] / preparing[medium][campaign][keyword][content]['orders'] * 100, 2) if preparing[medium][campaign][keyword][content]['orders'] else 0
                    approves_median = round(preparing[medium][campaign][keyword][content]['price_median'] / preparing[medium][campaign][keyword][content]['approves_median'], 2) if preparing[medium][campaign][keyword][content]['approves_median'] else 0
                    usd_median = round(approves_median * 1000 * sum_usd_rate, 2)

                    result.append(
                        {
                            'medium': None if medium == 'empty' else medium,
                            'campaign': None if campaign == 'empty' else campaign,
                            'keyword': None if keyword == 'empty' else keyword,
                            'content': None if content == 'empty' else content,
                            'status': preparing[medium][campaign][keyword][content]['status'],
                            'spend': preparing[medium][campaign][keyword][content]['spend'],
                            'conversion': preparing[medium][campaign][keyword][content]['conversion'],
                            'orders': preparing[medium][campaign][keyword][content]['orders'],
                            'clean_orders': preparing[medium][campaign][keyword][content]['clean_orders'],
                            'price': preparing[medium][campaign][keyword][content]['price'],
                            'approves': preparing[medium][campaign][keyword][content]['approves'],
                            'unprocessed': preparing[medium][campaign][keyword][content]['unprocessed'],
                            'trash': preparing[medium][campaign][keyword][content]['trash'],
                            'preorder': preparing[medium][campaign][keyword][content]['preorder'],
                            'completed': preparing[medium][campaign][keyword][content]['completed'],
                            'percent_trash': round(preparing[medium][campaign][keyword][content]['trash'] / preparing[medium][campaign][keyword][content]['orders'] * 100, 2) if preparing[medium][campaign][keyword][content]['orders'] else 0,
                            'percent_unprocessed': round(preparing[medium][campaign][keyword][content]['unprocessed'] / preparing[medium][campaign][keyword][content]['orders'] * 100, 2) if preparing[medium][campaign][keyword][content]['orders'] else 0,
                            'percent_approve': percent_approve,
                            'avg_price': approves_median,
                            'percent_preorder': round(preparing[medium][campaign][keyword][content]['preorder'] / preparing[medium][campaign][keyword][content]['orders'] * 100, 2) if preparing[medium][campaign][keyword][content]['orders'] else 0,
                            'percent_completed': round(preparing[medium][campaign][keyword][content]['completed'] / preparing[medium][campaign][keyword][content]['approves'] * 100, 2) if preparing[medium][campaign][keyword][content]['approves'] else 0,
                            'lead_price': round(preparing[medium][campaign][keyword][content]['spend'] / preparing[medium][campaign][keyword][content]['conversion'], 2) if preparing[medium][campaign][keyword][content]['conversion'] else 0,
                            'usd_median': usd_median,
                        }
                    )

    return result

async def generate_offers_data(
    offers_data: dict,
    inventory: dict,
    approve_statuses: tuple[str, ...],
    campaigns_data: dict,
    month_minus_offers_data: dict,
    preorder_marked_offers: dict,
    new_marked_offers: dict,
    roi_marked_offers: dict,
    offers_additional_data: dict,
    orders_period: list[Order],
    orders_month: list[Order],
    insight_period: list[Insight],
    insight_month: list[Insight],
    sum_usd_rate: float,
    month: bool,
    lifetime: bool,
    orders_lifetime,
    insight_lifetime,
    is_old_kpi: bool,
) -> tuple[dict, list]:
    result, buyer_ids, insights, periods = {}, [], {}, ('first', 'second', 'third') if lifetime else ('first', 'second')
    result_model = []

    await orders_stats(result, orders_period, 'first', offers_data, inventory, approve_statuses)
    if month:
        await orders_stats(result, orders_month, 'second', offers_data, inventory, approve_statuses)
    if lifetime:
        await orders_stats(result, orders_lifetime, 'third', offers_data, inventory, approve_statuses)

    await insights_stats(insights, insight_period, 'first')
    if month:
        await insights_stats(insights, insight_month, 'second')
    if lifetime:
        await insights_stats(insights, insight_lifetime, 'third')

    for offer_id in result.keys():
        for buyer_id in result[offer_id].keys():
            campaign_data = campaigns_data.get(offer_id, {}).get(buyer_id, {'active': []})

            for site_type in result[offer_id][buyer_id].keys():
                model = result[offer_id][buyer_id][site_type].copy()
                model["site_type"] = site_type
                model["status"] = "✅" if campaign_data["active"] else "🚫"
                model["with_month_minus"] = True if month_minus_offers_data.get(offer_id, {}).get(buyer_id, {}).get(site_type, {}) else False
                model["campaigns"] = len(campaign_data["active"])
                normalized_offer_id = normalize_offer_id(offer_id)
                offer_additional_data = offers_additional_data.get(
                    normalized_offer_id,
                    {"kpi_percentage": TRAFFIC_DEFAULT_KPI_PERCENTAGE},
                )
                offer_kpi_percentage = get_offer_percentage_rate(offer_additional_data["kpi_percentage"], offer_id, is_old_kpi)

                for period in model.keys():
                    if model[period] and period in periods:
                        model[period]["unprocessed_percentage"] = round(model[period]["unprocessed_count"] / model[period]["all_count"] * 100, 2) if model[period]["all_count"] else 0
                        model[period]["trash_percentage"] = round(model[period]["trash_count"] / model[period]["all_count"] * 100, 2) if model[period]["all_count"] else 0
                        model[period]["approves_percentage"] = round(model[period]["approves_count"] / model[period]["all_count"] * 100, 2) if model[period]["all_count"] else 0
                        model[period]["preorder_percentage"] = round(model[period]["preorder_count"] / model[period]["all_count"] * 100, 2) if model[period]["all_count"] else 0
                        model[period]["completed_percentage"] = round(model[period]["completed_count"] / model[period]["approves_count"] * 100, 2) if model[period]["approves_count"] else 0
                        model[period]["approves_median"] = model[period]["approves_median_sum"] / model[period]["approves_median_count"] if model[period]["approves_median_count"] else 0

                        if insights.get(offer_id) and insights[offer_id].get(buyer_id) and insights[offer_id][buyer_id].get(site_type):
                            model[period]["spend"] = insights[offer_id][buyer_id][site_type][period]["spend"]
                            model[period]["conversion"] = insights[offer_id][buyer_id][site_type][period]["conversion"]
                            model[period]["link_clicks"] = insights[offer_id][buyer_id][site_type][period]["link_clicks"]

                        else:
                            model[period]["spend"] = 0
                            model[period]["conversion"] = 0
                            model[period]["link_clicks"] = 0

                        model[period]["cr_percentage"] = round(model[period]["all_count"] / model[period]["link_clicks"] * 100, 2) if model[period]["link_clicks"] else 0
                        model[period]["lead_price"] = model[period]["spend"] / model[period]["conversion"] if model[period]["conversion"] else 0

                        if period == 'first':
                            model[period]['usd_median'] = model[period]["approves_median"] * 1000 * sum_usd_rate

                model["first"].update(
                    calculate_price_indicators(
                        spend=model["first"]["spend"],
                        approves_count=model["first"]["approves_count"],
                        avg_check_usd=model["first"]["usd_median"],
                        kpi_percentage=offer_kpi_percentage,
                    )
                )

                model["marks"], offer_data_marks = [], offers_data.get(normalized_offer_id, {}).get('marks', [])

                if offer_kpi_percentage != 0.25:
                    model["marks"].append(
                        {
                            "symbol": "📉",
                            "tip": f"KPI на апрув: {offer_kpi_percentage * 100}% от ср. чека"
                        }
                    )

                if normalized_offer_id in roi_marked_offers and campaign_data["active"]:
                    model["marks"].append(
                        {
                            "symbol": "❗️",
                            "tip": "Оффер имеет отрицательные ROI. Уточить у ТЛ возможность лить дальше"
                        }
                    )

                if 'delivering' in offer_data_marks:
                    model["marks"].append(
                        {
                            "symbol": "🚚",
                            "tip": "Оффер дозаказан и доставляется"
                        }
                    )

                if 'additional_purchase' in offer_data_marks:
                    model["marks"].append(
                        {
                            "symbol": "📦",
                            "tip": "Оффер отправлен на дозакуп"
                        }
                    )

                if 'no_additional_purchase' in offer_data_marks:
                    model["marks"].append(
                        {
                            "symbol": "🚫",
                            "tip": "Больше закупаться не будет"
                        }
                    )

                if preorder_mark := preorder_marked_offers.get(normalized_offer_id):
                    model["marks"].append(preorder_mark)

                if new_mark := new_marked_offers.get(offer_id, {}).get(buyer_id, {}).get(site_type, {}):
                    model["marks"].append(new_mark)

                if not model["marks"]:
                    model["marks"] = [{"symbol": "", "tip": ""}]

                if model["first"]["spend"] or model["first"]["all_count"]:
                    result_model.append(model)

                if buyer_id not in buyer_ids:
                    buyer_ids.append(buyer_id)

    for offer_id in insights.keys():
        for buyer_id in insights[offer_id].keys():
            for site_type in insights[offer_id][buyer_id].keys():
                if result.get(offer_id) and result[offer_id].get(buyer_id) and result[offer_id][buyer_id].get(site_type):
                    continue

                else:
                    campaign_data = campaigns_data.get(offer_id, {}).get(buyer_id, {'active': []})
                    normalized_offer_id = normalize_offer_id(offer_id)
                    offer_additional_data = offers_additional_data.get(
                        normalized_offer_id,
                        {"kpi_percentage": TRAFFIC_DEFAULT_KPI_PERCENTAGE},
                    )
                    offer_kpi_percentage = get_offer_percentage_rate(offer_additional_data["kpi_percentage"], offer_id, is_old_kpi)

                    try:
                        int(normalized_offer_id.split('-')[2].replace('$', ''))
                        flow_type = "Оффер"

                        if offers_data.get(normalized_offer_id):
                            offer_name = offers_data.get(normalized_offer_id)['name']

                        else:
                            offer_name = offer_id

                    except (ValueError, IndexError):
                        flow_type = "Каталог"
                        offer_name = offer_id

                    if offers_data.get(normalized_offer_id):
                        column_name = offers_data.get(normalized_offer_id)['column']
                        card_url = offers_data.get(normalized_offer_id)['url']

                    else:
                        column_name = ""
                        card_url = ""

                    campaigns = len(campaign_data["active"])
                    has_out_of_stock = True if 0 in [item.get('quantity', 0) for item in inventory.get(normalized_offer_id, {}).get('offers', {}).values()] else False

                    model = {
                        'offer_id': offer_id,
                        'flow_type': flow_type,
                        'buyer_id': buyer_id,
                        'name': offer_name,
                        'column': column_name,
                        'url': card_url,
                        'inventory': inventory.get(normalized_offer_id, dict(TRAFFIC_DEFAULT_INVENTORY)),
                        'has_out_of_stock': has_out_of_stock,
                        'site_type': site_type,
                        'status': "✅" if campaign_data["active"] else "🚫",
                        'with_month_minus': True if month_minus_offers_data.get(offer_id, {}).get(buyer_id, {}).get(site_type, {}) else False,
                        'campaigns': campaigns,
                        'marks': [],
                        'first': {
                            "all_count": 0,
                            "clean_count": 0,
                            "unprocessed_count": 0,
                            "approves_count": 0,
                            "approves_median_count": 0,
                            "trash_count": 0,
                            "preorder_count": 0,
                            "completed_count": 0,
                            "approves_sum": 0,
                            "approves_median_sum": 0,
                            "cr_percentage": 0,
                            "spend": 0,
                            "conversion": 0,
                            "link_clicks": 0
                        },
                        'second': {
                            "all_count": 0,
                            "clean_count": 0,
                            "unprocessed_count": 0,
                            "approves_count": 0,
                            "approves_median_count": 0,
                            "trash_count": 0,
                            "preorder_count": 0,
                            "completed_count": 0,
                            "approves_sum": 0,
                            "approves_median_sum": 0,
                            "cr_percentage": 0,
                            "spend": 0,
                            "conversion": 0,
                            "link_clicks": 0
                        },
                        'third': {
                            "all_count": 0,
                            "clean_count": 0,
                            "unprocessed_count": 0,
                            "approves_count": 0,
                            "approves_median_count": 0,
                            "trash_count": 0,
                            "preorder_count": 0,
                            "completed_count": 0,
                            "approves_sum": 0,
                            "approves_median_sum": 0,
                            "cr_percentage": 0,
                            "spend": 0,
                            "conversion": 0,
                            "link_clicks": 0
                        },
                    }

                    if offer_kpi_percentage != 0.25:
                        model["marks"].append(
                            {
                                "symbol": "📉",
                                "tip": f"KPI на апрув: {offer_kpi_percentage * 100}% от ср. чека"
                            }
                        )

                    if normalized_offer_id in roi_marked_offers and campaign_data["active"]:
                        model["marks"].append(
                            {
                                "symbol": "❗️",
                                "tip": "Оффер имеет отрицательные ROI. Уточить у ТЛ возможность лить дальше"
                            }
                        )

                    if offers_data.get(normalized_offer_id, {}).get('is_delivering', False):
                        model["marks"].append(
                            {
                                "symbol": "🚚",
                                "tip": "Оффер дозаказан и доставляется"
                            }
                        )

                    if preorder_mark := preorder_marked_offers.get(normalized_offer_id):
                        model["marks"].append(preorder_mark)

                    if new_mark := new_marked_offers.get(offer_id, {}).get(buyer_id, {}).get(site_type, {}):
                        model["marks"].append(new_mark)

                    if not model["marks"]:
                        model["marks"] = [{"symbol": "", "tip": ""}]

                    for period in periods:
                        model[period]["unprocessed_percentage"] = 0
                        model[period]["trash_percentage"] = 0
                        model[period]["approves_percentage"] = 0
                        model[period]["preorder_percentage"] = 0
                        model[period]["completed_percentage"] = 0
                        model[period]["approves_median"] = 0

                        model[period]["spend"] = insights[offer_id][buyer_id][site_type][period]["spend"]
                        model[period]["conversion"] = insights[offer_id][buyer_id][site_type][period]["conversion"]
                        model[period]["link_clicks"] = insights[offer_id][buyer_id][site_type][period]["link_clicks"]

                        model[period]["lead_price"] = model[period]["spend"] / model[period]["conversion"] if model[period]["conversion"] else 0

                        if period == 'first':
                            model[period]['usd_median'] = 0

                    model["first"].update(
                        calculate_price_indicators(
                            spend=model["first"]["spend"],
                            approves_count=model["first"]["approves_count"],
                            avg_check_usd=model["first"]["usd_median"],
                            kpi_percentage=offer_kpi_percentage,
                        )
                    )

                    if model["first"]["spend"] or model["first"]["all_count"]:
                        result_model.append(model)

                    if buyer_id not in buyer_ids:
                        buyer_ids.append(buyer_id)

    return result_model, buyer_ids
