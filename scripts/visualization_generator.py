"""
Marketing Dashboard - Business Visualization Generator
비즈니스 의사결정용 시각화 생성
"""

import json
import matplotlib.pyplot as plt
import matplotlib.font_manager as fm
from pathlib import Path
import sys

# 한글 폰트 설정
plt.rcParams['font.family'] = 'Malgun Gothic'
plt.rcParams['axes.unicode_minus'] = False

# 경로 설정
BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / 'data'
FORECAST_DIR = DATA_DIR / 'forecast'
VIS_DIR = DATA_DIR / 'visualizations'


class BusinessVisualizer:
    """비즈니스 의사결정용 시각화 생성기"""

    def __init__(self):
        self.segment_stats = None
        self.insights = None

    def load_data(self) -> None:
        """데이터 로드"""
        print("\n" + "="*60)
        print("Business Visualization Generator v1.0")
        print("="*60)
        print("\n[1/4] Loading data...")

        # segment_stats.json 로드
        stats_file = FORECAST_DIR / 'segment_stats.json'
        if not stats_file.exists():
            raise FileNotFoundError(f"segment_stats.json not found: {stats_file}")

        with open(stats_file, 'r', encoding='utf-8') as f:
            self.segment_stats = json.load(f)
        print(f"   Loaded: segment_stats.json")

        # insights.json 로드
        insights_file = FORECAST_DIR / 'insights.json'
        if not insights_file.exists():
            raise FileNotFoundError(f"insights.json not found: {insights_file}")

        with open(insights_file, 'r', encoding='utf-8') as f:
            self.insights = json.load(f)
        print(f"   Loaded: insights.json")

    def create_channel_roas_chart(self) -> None:
        """채널별 ROAS 비교 바차트 생성"""
        print("\n[2/4] Creating channel ROAS comparison chart...")

        channels = self.segment_stats.get('channel', {})

        # ROAS > 0인 채널만 필터링 및 정렬
        channel_data = [(name, data['roas'])
                       for name, data in channels.items()
                       if data.get('roas', 0) > 0]
        channel_data.sort(key=lambda x: x[1], reverse=True)

        if not channel_data:
            print("   [WARNING] No channel data with ROAS > 0")
            return

        names = [x[0] for x in channel_data]
        roas_values = [x[1] for x in channel_data]

        # 색상: 100% 이상은 초록색, 이하는 빨간색
        colors = ['#00c853' if r >= 100 else '#ff1744' for r in roas_values]

        # 차트 생성
        fig, ax = plt.subplots(figsize=(12, 6))
        bars = ax.barh(names, roas_values, color=colors, alpha=0.8)

        # 100% 기준선
        ax.axvline(x=100, color='#9e9e9e', linestyle='--', linewidth=2, label='손익분기점 (100%)')

        # 값 레이블 추가
        for i, (bar, value) in enumerate(zip(bars, roas_values)):
            ax.text(value + 5, i, f'{value:.1f}%',
                   va='center', fontweight='bold', fontsize=10)

        ax.set_xlabel('ROAS (%)', fontsize=12, fontweight='bold')
        ax.set_title('채널별 ROAS 비교 (Return on Ad Spend)',
                    fontsize=14, fontweight='bold', pad=20)
        ax.legend(loc='lower right')
        ax.grid(axis='x', alpha=0.3)

        plt.tight_layout()
        output_file = VIS_DIR / 'channel_roas_comparison.png'
        plt.savefig(output_file, dpi=150, bbox_inches='tight')
        plt.close()

        print(f"   Saved: {output_file.name}")

    def create_product_revenue_pie(self) -> None:
        """제품별 매출 기여도 파이차트 생성"""
        print("\n[3/4] Creating product revenue contribution chart...")

        products = self.segment_stats.get('product', {})

        # 매출 > 0인 제품만 필터링 및 정렬
        product_data = [(name, data['total_revenue'])
                       for name, data in products.items()
                       if data.get('total_revenue', 0) > 0]
        product_data.sort(key=lambda x: x[1], reverse=True)

        if not product_data:
            print("   [WARNING] No product data with revenue > 0")
            return

        # 상위 7개 + 기타
        top_n = 7
        if len(product_data) > top_n:
            top_products = product_data[:top_n]
            others_revenue = sum(x[1] for x in product_data[top_n:])
            top_products.append(('기타 제품', others_revenue))
        else:
            top_products = product_data

        names = [x[0] for x in top_products]
        revenues = [x[1] for x in top_products]

        # 색상 팔레트
        colors = ['#673ab7', '#2196f3', '#00c853', '#ffab00',
                 '#ff1744', '#9c27b0', '#00bcd4', '#9e9e9e']

        # 파이차트 생성
        fig, ax = plt.subplots(figsize=(10, 8))
        wedges, texts, autotexts = ax.pie(
            revenues,
            labels=names,
            autopct='%1.1f%%',
            colors=colors[:len(names)],
            startangle=90,
            textprops={'fontsize': 10, 'fontweight': 'bold'}
        )

        # 퍼센트 텍스트 스타일
        for autotext in autotexts:
            autotext.set_color('white')
            autotext.set_fontsize(11)

        ax.set_title('제품별 매출 기여도 (전환값 기준)',
                    fontsize=14, fontweight='bold', pad=20)

        plt.tight_layout()
        output_file = VIS_DIR / 'product_revenue_pie.png'
        plt.savefig(output_file, dpi=150, bbox_inches='tight')
        plt.close()

        print(f"   Saved: {output_file.name}")

    def create_budget_gauge(self) -> None:
        """예산 소진율 게이지 차트 생성"""
        print("\n[4/4] Creating budget consumption gauge...")

        # insights에서 예산 소진율 추출
        alerts = self.insights.get('overall', {}).get('alerts', [])
        budget_alert = next((a for a in alerts if a['type'] == 'budget_alert'), None)

        if not budget_alert:
            print("   [WARNING] No budget alert found")
            return

        # 메시지에서 퍼센트 추출 (예: "월 예산 대비 109.0% 소진")
        message = budget_alert.get('message', '')
        try:
            consumption = float(message.split('%')[0].split()[-1])
        except:
            print(f"   [WARNING] Could not parse budget consumption from: {message}")
            return

        # 반원 게이지 차트
        fig, ax = plt.subplots(figsize=(10, 6), subplot_kw={'projection': 'polar'})

        # 게이지 범위: 0-150%
        max_val = 150
        theta = [i * 3.14159 / 180 for i in range(0, 181)]

        # 배경 (회색)
        background = [max_val] * len(theta)
        ax.plot(theta, background, color='#e0e0e0', linewidth=20, alpha=0.3)

        # 현재 값 (색상: 0-80% 녹색, 80-100% 노란색, 100%+ 빨간색)
        if consumption < 80:
            color = '#00c853'
        elif consumption < 100:
            color = '#ffab00'
        else:
            color = '#ff1744'

        current_angle = min(consumption / max_val * 3.14159, 3.14159)
        current_theta = [i * 3.14159 / 180 for i in range(0, int(current_angle * 180 / 3.14159) + 1)]
        current_values = [consumption] * len(current_theta)
        ax.plot(current_theta, current_values, color=color, linewidth=20)

        # 100% 기준선
        marker_angle = 100 / max_val * 3.14159
        ax.plot([marker_angle, marker_angle], [0, max_val],
               color='#9e9e9e', linewidth=3, linestyle='--')

        # 중앙 텍스트
        ax.text(0, 0, f'{consumption:.1f}%',
               ha='center', va='center', fontsize=36, fontweight='bold', color=color)
        ax.text(0, -30, '예산 소진율',
               ha='center', va='center', fontsize=14, color='#616161')

        # 설정
        ax.set_ylim(0, max_val)
        ax.set_theta_zero_location('W')
        ax.set_theta_direction(1)
        ax.set_xticks([])
        ax.set_yticks([])
        ax.spines['polar'].set_visible(False)
        ax.grid(False)

        plt.title('월 예산 소진율', fontsize=14, fontweight='bold', pad=30)
        plt.tight_layout()

        output_file = VIS_DIR / 'budget_gauge.png'
        plt.savefig(output_file, dpi=150, bbox_inches='tight')
        plt.close()

        print(f"   Saved: {output_file.name}")

    def generate_all(self) -> None:
        """모든 시각화 생성"""
        try:
            self.load_data()
            self.create_channel_roas_chart()
            self.create_product_revenue_pie()
            self.create_budget_gauge()

            print("\n" + "="*60)
            print("Business visualizations generated successfully!")
            print("="*60)

        except Exception as e:
            print(f"\n[ERROR] {e}")
            import traceback
            traceback.print_exc()
            sys.exit(1)


def main():
    """메인 함수"""
    visualizer = BusinessVisualizer()
    visualizer.generate_all()


if __name__ == '__main__':
    main()
