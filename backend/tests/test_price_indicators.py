import pytest

from app.utils.orders import calculate_price_indicators


def test_fact_equals_max_no_minus():
    # Пример из ТЗ: 500$ / 20 апрувов = 25$, сред. чек 100$ * 25% = 25$
    result = calculate_price_indicators(spend=500, approves_count=20, avg_check_usd=100, kpi_percentage=0.25)

    assert result["price_fact"] == 25
    assert result["price_max"] == 25
    assert result["minus"] == 0


def test_fact_below_max_no_minus():
    result = calculate_price_indicators(spend=300, approves_count=20, avg_check_usd=100, kpi_percentage=0.25)

    assert result["price_fact"] == 15
    assert result["price_max"] == 25
    assert result["minus"] == 0


def test_fact_above_max_gives_minus():
    # Пример из ТЗ: Fact = 30$, Max = 25$, апрувов 20 -> минус -100$
    result = calculate_price_indicators(spend=600, approves_count=20, avg_check_usd=100, kpi_percentage=0.25)

    assert result["price_fact"] == 30
    assert result["price_max"] == 25
    assert result["minus"] == -100


def test_no_approves_with_spend_puts_all_spend_to_minus():
    result = calculate_price_indicators(spend=137.5, approves_count=0, avg_check_usd=0, kpi_percentage=0.25)

    assert result["price_fact"] is None
    assert result["minus"] == -137.5


def test_no_approves_no_spend():
    result = calculate_price_indicators(spend=0, approves_count=0, avg_check_usd=0, kpi_percentage=0.25)

    assert result["price_fact"] is None
    assert result["price_max"] == 0
    assert result["minus"] == 0


def test_custom_offer_kpi_percentage():
    # У части офферов KPI отличается от дефолтных 25% (TRAFFIC_OFFERS_ADDITIONAL_DATA)
    result = calculate_price_indicators(spend=400, approves_count=20, avg_check_usd=100, kpi_percentage=0.155)

    assert result["price_fact"] == 20
    assert result["price_max"] == pytest.approx(15.5)
    assert result["minus"] == pytest.approx(-90)


def test_approves_without_avg_check_puts_all_spend_to_minus():
    # Апрувы есть, но ни один не прошёл порог среднего чека: max = 0, весь спенд — перерасход
    result = calculate_price_indicators(spend=200, approves_count=4, avg_check_usd=0, kpi_percentage=0.25)

    assert result["price_fact"] == 50
    assert result["price_max"] == 0
    assert result["minus"] == -200
