def evaluate_performance(row):
    """
    유형구분_통합(전환/트래픽)에 따른 성과 평가 로직 분기
    """
    campaign_type = row.get('유형구분_통합', '전환') 
    
    # A. 트래픽 캠페인 (Traffic Objective)
    # -> CPC(낮을수록 좋음), CTR(높을수록 좋음) 중심 평가
    if campaign_type == '트래픽':
        cpc = row.get('cpc', 0)
        ctr = row.get('ctr', 0)
        
        if cpc < 200 and ctr > 3.0:
            return {'level': '매우 우수', 'desc': '저비용 고효율 유입'}
        elif cpc > 1000:
            return {'level': '개선 필요', 'desc': '타겟 과소/비용 과다'}
        else:
            return {'level': '양호', 'desc': '일반적인 유입 성과'}
            
    # B. 전환 캠페인 (Conversion Objective)
    # -> ROAS(높을수록 좋음), CVR(높을수록 좋음) 중심 평가
    else: 
        roas = row.get('roas', 0)
        
        if roas > 500:
            return {'level': '매우 우수', 'desc': '수익성 최고조'}
        elif roas < 100:
            return {'level': '위험', 'desc': '손익분기점 미달'}
        else:
            return {'level': '양호', 'desc': '안정적 운영 중'}