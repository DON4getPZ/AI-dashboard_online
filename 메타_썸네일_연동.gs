// ========================================
// 메뉴 설정 (통합 - 두 스크립트 모두 포함)
// ========================================

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  
  // Drive 이미지 관리 메뉴
  ui.createMenu('📁 Drive 이미지 관리')
    .addItem('🖼️ 이미지 목록 가져오기', 'drive_getImageList')
    .addItem('🔄 목록 새로고침', 'drive_refreshImageList')
    .addItem('📂 폴더 ID 설정', 'drive_setFolderId')
    .addItem('📂 하위 폴더 포함 가져오기', 'drive_getImageListWithSubfolders')
    .addSeparator()
    .addSubMenu(ui.createMenu('🔓 공유 설정')
      .addItem('🌐 폴더 전체 공개 설정', 'drive_makeFolderPublic')
      .addItem('🔒 폴더 전체 비공개 설정', 'drive_makeFolderPrivate')
      .addItem('📋 공개 URL로 목록 가져오기', 'drive_getImageListWithPublicUrls'))
    .addSeparator()
    .addSubMenu(ui.createMenu('⏰ 자동 실행 설정')
      .addItem('📅 매일 실행 (오전 9시)', 'drive_createDailyTrigger')
      .addItem('📅 평일만 실행 (월-금)', 'drive_createWeekdayTrigger')
      .addItem('🕐 실행 시간 변경', 'drive_setTriggerTime')
      .addSeparator()
      .addItem('📋 트리거 확인', 'drive_checkTriggers')
      .addItem('🗑️ 트리거 삭제', 'drive_deleteTriggersWithConfirm'))
    .addSeparator()
    .addItem('🔑 권한 승인', 'drive_authorizeScript')
    .addItem('ℹ️ 사용 가이드', 'drive_showGuide')
    .addToUi();
  
  // Meta 광고 이미지 수집 메뉴
  ui.createMenu('📊 Meta 광고 이미지 수집')
    .addItem('🚀 실행하기', 'meta_fetchAllAdImages')
    .addSeparator()
    .addSubMenu(ui.createMenu('⚙️ 설정')
      .addItem('📂 광고계정 ID', 'meta_setAccountId')
      .addItem('🔑 액세스 토큰', 'meta_setAccessToken')
      .addItem('📅 조회 기간', 'meta_setDateRange')
      .addItem('✅ 현재 설정 확인', 'meta_checkSettings'))
    .addSubMenu(ui.createMenu('⏰ 자동 실행')
      .addItem('📅 매일 실행', 'meta_createDailyTrigger')
      .addItem('🗑️ 트리거 삭제', 'meta_deleteTriggersWithConfirm'))
    .addItem('ℹ️ 가이드', 'meta_showGuide')
    .addToUi();
}


// ========================================
// Meta 광고 이미지 수집 스크립트 (Python 로직 기반 최적화 버전)
// Key: ad_name 기준 매핑
// Python 버전 로직 완전 반영:
// - Creative API Fallback (Step 2)
// - Preview API Fallback (Step 3) - 신규 추가
// - thumbnail_url 고해상도 지원
// - 재시도 로직 강화
// ========================================

const META_CONFIG = {
  SHEET_NAME: 'RAW-메타-썸네일',
  DEFAULT_TRIGGER_HOUR: 9,
  API_VERSION: 'v21.0',
  BATCH_SIZE: 20,
  FETCH_LIMIT: 25,
  API_DELAY: 1000,
  MAX_PAGES: 500,
  MAX_RETRIES: 3,
  PREVIEW_BATCH_SIZE: 10,  // Preview API는 더 작은 배치 사용
  MAX_WORKERS: 5           // 병렬 처리 제한
};

// ========================================
// 설정 관리
// ========================================

function meta_getProps() {
  return PropertiesService.getScriptProperties();
}

function meta_setAccountId() {
  const ui = SpreadsheetApp.getUi();
  const current = meta_getProps().getProperty('META_AD_ACCOUNT_ID') || '(미설정)';
  
  const response = ui.prompt('📂 광고계정 ID 설정', 
    `현재: ${current}\n\n예: act_123456789`, ui.ButtonSet.OK_CANCEL);
  
  if (response.getSelectedButton() === ui.Button.OK) {
    const value = response.getResponseText().trim();
    if (value) {
      meta_getProps().setProperty('META_AD_ACCOUNT_ID', value);
      ui.alert(`✅ 설정 완료: ${value}`);
    }
  }
}

function meta_setAccessToken() {
  const ui = SpreadsheetApp.getUi();
  const current = meta_getProps().getProperty('META_ACCESS_TOKEN');
  const display = current ? '설정됨' : '(미설정)';
  
  const response = ui.prompt('🔑 액세스 토큰 설정', 
    `현재: ${display}\n\nMeta 개발자 도구에서 발급받은 토큰 입력:`, ui.ButtonSet.OK_CANCEL);
  
  if (response.getSelectedButton() === ui.Button.OK) {
    const value = response.getResponseText().trim();
    if (value) {
      meta_getProps().setProperty('META_ACCESS_TOKEN', value);
      ui.alert('✅ 토큰 설정 완료');
    }
  }
}

function meta_setDateRange() {
  const ui = SpreadsheetApp.getUi();
  const props = meta_getProps();
  
  const startResponse = ui.prompt('📅 시작 날짜', 
    '형식: yyyy-mm-dd (비우면 전체 조회)', ui.ButtonSet.OK_CANCEL);
  if (startResponse.getSelectedButton() !== ui.Button.OK) return;
  props.setProperty('META_START_DATE', startResponse.getResponseText().trim());
  
  const endResponse = ui.prompt('📅 종료 날짜', 
    '형식: yyyy-mm-dd (비우면 오늘까지)', ui.ButtonSet.OK_CANCEL);
  if (endResponse.getSelectedButton() !== ui.Button.OK) return;
  props.setProperty('META_END_DATE', endResponse.getResponseText().trim());
  
  ui.alert('✅ 기간 설정 완료');
}

function meta_getSettings() {
  const props = meta_getProps();
  return {
    accountId: props.getProperty('META_AD_ACCOUNT_ID') || '',
    token: props.getProperty('META_ACCESS_TOKEN') || '',
    startDate: props.getProperty('META_START_DATE') || '',
    endDate: props.getProperty('META_END_DATE') || ''
  };
}

function meta_checkSettings() {
  const s = meta_getSettings();
  const lastUpdate = meta_getProps().getProperty('META_LAST_UPDATE') || '없음';
  
  SpreadsheetApp.getUi().alert(
    `📋 현재 설정\n\n` +
    `광고계정: ${s.accountId || '(미설정)'}\n` +
    `토큰: ${s.token ? '설정됨' : '(미설정)'}\n` +
    `시작일: ${s.startDate || '전체'}\n` +
    `종료일: ${s.endDate || '오늘'}\n` +
    `마지막 실행: ${lastUpdate}`
  );
}

// ========================================
// 메인 실행 함수
// ========================================

function meta_fetchAllAdImages() {
  const settings = meta_getSettings();
  
  if (!settings.accountId || !settings.token) {
    try {
      SpreadsheetApp.getUi().alert('⚠️ 광고계정 ID와 액세스 토큰을 먼저 설정해주세요.');
    } catch (e) {
      Logger.log('ERROR: 설정 미완료');
    }
    return;
  }
  
  meta_processAds(settings);
}

// 트리거용 (UI 없이 실행)
function meta_fetchAllAdImagesAuto() {
  const settings = meta_getSettings();
  if (settings.accountId && settings.token) {
    meta_processAds(settings);
  }
}

// ========================================
// 광고 데이터 처리 (메인 프로세스 - Python 로직 반영)
// ========================================

function meta_processAds(settings) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(META_CONFIG.SHEET_NAME) || ss.insertSheet(META_CONFIG.SHEET_NAME);
  
  sheet.clear();
  
  // 헤더 설정
  const headers = ['ad_name', 'ad_id', 'preview_link', 'image_url', 'image_source'];
  sheet.appendRow(headers);
  sheet.getRange(1, 1, 1, headers.length)
    .setBackground('#4285f4')
    .setFontColor('#ffffff')
    .setFontWeight('bold');
  
  try {
    Logger.log('=== 광고 데이터 수집 시작 ===');
    
    // Step 1: 광고 목록 가져오기
    Logger.log('📋 Step 1: 광고 목록 조회...');
    const ads = meta_fetchAdList(settings);
    Logger.log(`✅ 광고 ${ads.length}개 조회됨`);
    
    if (ads.length === 0) {
      meta_showAlert('조회된 광고가 없습니다.');
      return;
    }
    
    // 현재 상태 확인
    let adsWithImage = ads.filter(ad => ad.imageUrl);
    let adsWithoutImage = ads.filter(ad => !ad.imageUrl);
    Logger.log(`   - 이미지 있는 광고: ${adsWithImage.length}개`);
    Logger.log(`   - 이미지 없는 광고: ${adsWithoutImage.length}개`);
    
    // Step 2: Creative API로 보완 (Fallback)
    if (adsWithoutImage.length > 0) {
      Logger.log(`\n📋 Step 2: Creative API Fallback 시작...`);
      meta_fetchCreativeImagesBatch(adsWithoutImage, settings);
      
      // Fallback 결과 확인
      const afterCreative = ads.filter(ad => ad.imageUrl).length;
      Logger.log(`   - 이미지 수집 성공: ${afterCreative}개`);
      Logger.log(`   - 이미지 없는 광고: ${ads.length - afterCreative}개`);
    }
    
    // Step 3: Preview API로 최종 보완 (Python 로직 추가)
    adsWithoutImage = ads.filter(ad => !ad.imageUrl);
    if (adsWithoutImage.length > 0) {
      Logger.log(`\n📋 Step 3: Preview API Fallback 시작...`);
      meta_fetchPreviewImagesBatch(adsWithoutImage, settings);
      
      const afterPreview = ads.filter(ad => ad.imageUrl).length;
      Logger.log(`   - 이미지 수집 성공: ${afterPreview}개`);
    }
    
    // Step 4: 시트에 데이터 입력 (ad_name 기준)
    const dataRows = ads.map(ad => [
      ad.adName,
      ad.adId,
      ad.previewLink,
      ad.imageUrl,
      ad.imageSource
    ]);
    
    if (dataRows.length > 0) {
      sheet.getRange(2, 1, dataRows.length, headers.length).setValues(dataRows);
    }
    
    // 스타일 적용
    sheet.autoResizeColumns(1, headers.length);
    const existingFilter = sheet.getFilter();
    if (existingFilter) existingFilter.remove();
    sheet.getRange(1, 1, dataRows.length + 1, headers.length).createFilter();
    
    // 결과 저장
    const successCount = ads.filter(ad => ad.imageUrl).length;
    const updateTime = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
    meta_getProps().setProperty('META_LAST_UPDATE', updateTime);
    
    // 소스별 통계
    const sourceStats = meta_getSourceStats(ads);
    
    Logger.log(`\n=== 완료: ${ads.length}개 중 ${successCount}개 이미지 수집 ===`);
    Logger.log(`소스별 통계: ${JSON.stringify(sourceStats)}`);
    
    meta_showAlert(
      `완료!\n\n` +
      `총 광고: ${ads.length}개\n` +
      `이미지 수집: ${successCount}개\n` +
      `수집 실패: ${ads.length - successCount}개\n\n` +
      `📊 소스별 통계:\n${meta_formatSourceStats(sourceStats)}\n\n` +
      `업데이트: ${updateTime}`
    );
    
  } catch (error) {
    Logger.log('ERROR: ' + error.message);
    meta_showAlert('오류: ' + error.message);
  }
}

// ========================================
// 소스별 통계
// ========================================

function meta_getSourceStats(ads) {
  const stats = {};
  ads.forEach(ad => {
    if (ad.imageSource) {
      stats[ad.imageSource] = (stats[ad.imageSource] || 0) + 1;
    }
  });
  return stats;
}

function meta_formatSourceStats(stats) {
  return Object.entries(stats)
    .map(([source, count]) => `  - ${source}: ${count}개`)
    .join('\n');
}

// ========================================
// API: 광고 목록 가져오기
// ========================================

function meta_fetchAdList(settings) {
  const ads = [];
  
  // 필터 설정
  const filters = [];
  if (settings.startDate) {
    const ts = meta_dateToTimestamp(settings.startDate);
    if (ts) {
      filters.push({field: "created_time", operator: "GREATER_THAN", value: ts});
    }
  }
  if (settings.endDate) {
    const ts = meta_dateToTimestamp(settings.endDate);
    if (ts) {
      filters.push({field: "created_time", operator: "LESS_THAN", value: ts});
    }
  }
  const filterParam = filters.length > 0 ? `&filtering=${encodeURIComponent(JSON.stringify(filters))}` : '';
  
  // API 필드 (간소화 - 나머지는 Creative API fallback에서 처리)
  const fields = [
    'id',
    'name',
    'preview_shareable_link',
    'creative{id,image_url,object_story_spec{video_data{image_url},link_data{picture}}}'
  ].join(',');
  
  let url = `https://graph.facebook.com/${META_CONFIG.API_VERSION}/${settings.accountId}/ads?fields=${encodeURIComponent(fields)}&limit=${META_CONFIG.FETCH_LIMIT}${filterParam}&access_token=${settings.token}`;
  
  let pageCount = 0;
  
  while (url && pageCount < META_CONFIG.MAX_PAGES) {
    pageCount++;
    Logger.log(`📄 페이지 ${pageCount} 조회 중...`);
    
    const response = meta_makeRequestWithRetry(url);
    
    if (response.error) {
      throw new Error(`API 오류: ${response.error.message}`);
    }
    
    if (!response.data || response.data.length === 0) break;
    
    response.data.forEach(ad => {
      const imageInfo = meta_extractImageUrl(ad);
      
      ads.push({
        adName: ad.name || '',
        adId: ad.id,
        previewLink: ad.preview_shareable_link || '',
        creativeId: ad.creative?.id || '',
        imageUrl: imageInfo.url,
        imageSource: imageInfo.source
      });
    });
    
    url = response.paging?.next || null;
    if (url) Utilities.sleep(1500); // Rate limit 방지 (Python과 동일하게 1.5초)
  }
  
  return ads;
}

// ========================================
// API 요청 (재시도 로직 포함 - Python 로직 반영)
// ========================================

function meta_makeRequestWithRetry(url, retryCount = 0) {
  try {
    const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    const statusCode = response.getResponseCode();
    
    // Rate limit 또는 서버 오류 시 재시도
    if ([429, 500, 502, 503, 504].includes(statusCode)) {
      if (retryCount < META_CONFIG.MAX_RETRIES) {
        const waitTime = (retryCount + 1) * 10 * 1000; // 10초, 20초, 30초...
        Logger.log(`⏳ Rate limit - ${waitTime / 1000}초 대기 후 재시도 (${retryCount + 1}/${META_CONFIG.MAX_RETRIES})...`);
        Utilities.sleep(waitTime);
        return meta_makeRequestWithRetry(url, retryCount + 1);
      }
    }
    
    const data = JSON.parse(response.getContentText());
    
    // API 레벨 rate limit 오류 확인
    if (data.error) {
      const errorMsg = data.error.message || '';
      if ((errorMsg.toLowerCase().includes('too many calls') || errorMsg.toLowerCase().includes('rate limit')) 
          && retryCount < META_CONFIG.MAX_RETRIES) {
        const waitTime = (retryCount + 1) * 10 * 1000;
        Logger.log(`⏳ Rate limit - ${waitTime / 1000}초 대기 후 재시도 (${retryCount + 1}/${META_CONFIG.MAX_RETRIES})...`);
        Utilities.sleep(waitTime);
        return meta_makeRequestWithRetry(url, retryCount + 1);
      }
    }
    
    return data;
  } catch (e) {
    if (retryCount < META_CONFIG.MAX_RETRIES) {
      const waitTime = (retryCount + 1) * 5 * 1000;
      Logger.log(`⏳ 요청 오류 - ${waitTime / 1000}초 대기 후 재시도...`);
      Utilities.sleep(waitTime);
      return meta_makeRequestWithRetry(url, retryCount + 1);
    }
    throw new Error(`요청 실패: ${e.message}`);
  }
}

// ========================================
// 이미지 URL 추출 (우선순위별 - Python 로직 적용)
// ========================================

function meta_extractImageUrl(ad) {
  const creative = ad.creative || {};
  const spec = creative.object_story_spec || {};
  const linkData = spec.link_data || {};
  const videoData = spec.video_data || {};
  
  // 1순위: creative.image_url
  if (creative.image_url) {
    return { url: creative.image_url, source: 'creative_image_url' };
  }
  
  // 2순위: video_data.image_url
  if (videoData.image_url) {
    return { url: videoData.image_url, source: 'video_data_image_url' };
  }
  
  // 3순위: link_data.picture
  if (linkData.picture) {
    return { url: linkData.picture, source: 'link_data_picture' };
  }
  
  return { url: '', source: '' };
}

// ========================================
// Creative API: 배치 처리로 이미지 가져오기 (Fallback - Python 로직 반영)
// ========================================

function meta_fetchCreativeImagesBatch(ads, settings) {
  const adsWithCreativeId = ads.filter(ad => ad.creativeId && !ad.imageUrl);
  
  if (adsWithCreativeId.length === 0) {
    Logger.log('Creative ID가 있는 광고가 없습니다.');
    return;
  }
  
  Logger.log(`🔄 Creative API Fallback 대상: ${adsWithCreativeId.length}개`);
  
  for (let i = 0; i < adsWithCreativeId.length; i += META_CONFIG.BATCH_SIZE) {
    const chunk = adsWithCreativeId.slice(i, i + META_CONFIG.BATCH_SIZE);
    Logger.log(`📦 배치 처리 중: ${i + 1} ~ ${i + chunk.length} / ${adsWithCreativeId.length}`);
    
    // 병렬 요청 생성 (Python과 동일하게 thumbnail 고해상도 파라미터 + Instagram media ID 추가)
    const requests = chunk.map(ad => ({
      url: `https://graph.facebook.com/${META_CONFIG.API_VERSION}/${ad.creativeId}?fields=image_url,object_story_spec,asset_feed_spec,thumbnail_url,effective_instagram_media_id&thumbnail_width=1200&thumbnail_height=1200&access_token=${settings.token}`,
      method: 'GET',
      muteHttpExceptions: true
    }));
    
    try {
      // 병렬 실행
      const responses = UrlFetchApp.fetchAll(requests);
      
      // 응답 처리
      responses.forEach((res, idx) => {
        const ad = chunk[idx];
        
        if (ad.imageUrl) return; // 이미 있으면 스킵
        
        if (res.getResponseCode() !== 200) {
          Logger.log(`⚠️ API 응답 오류 (${ad.adName.substring(0, 40)}): ${res.getResponseCode()}`);
          return;
        }
        
        try {
          const data = JSON.parse(res.getContentText());
          
          if (data.error) {
            Logger.log(`⚠️ Creative API 에러 (${ad.adName.substring(0, 40)}): ${data.error.message}`);
            return;
          }
          
          // Creative 데이터에서 이미지 추출
          const imageResult = meta_extractCreativeImage(data, ad, settings);
          if (imageResult) {
            ad.imageUrl = imageResult.url;
            ad.imageSource = imageResult.source;
            Logger.log(`✅ Creative 성공: ${ad.adName.substring(0, 50)}`);
          }
          
        } catch (e) {
          Logger.log(`⚠️ 파싱 오류 (${ad.adName.substring(0, 40)}): ${e.message}`);
        }
      });
      
    } catch (e) {
      Logger.log(`⚠️ 배치 전체 오류: ${e.message}`);
    }
    
    // 배치 간 딜레이 (Rate Limit 방지 - Python과 동일하게 2배)
    if (i + META_CONFIG.BATCH_SIZE < adsWithCreativeId.length) {
      Utilities.sleep(META_CONFIG.API_DELAY * 2);
    }
  }
}

// ========================================
// Creative 데이터에서 이미지 추출 (Python 로직 완전 반영)
// ========================================

function meta_extractCreativeImage(data, ad, settings) {
  // 1순위: creative.image_url (직접)
  if (data.image_url) {
    return { url: data.image_url, source: 'creative_direct' };
  }
  
  const spec = data.object_story_spec || {};
  
  // 2순위: video_data.image_url
  const videoData = spec.video_data || {};
  if (videoData.image_url) {
    return { url: videoData.image_url, source: 'creative_video_data' };
  }
  
  // 3순위: link_data.picture
  const linkData = spec.link_data || {};
  if (linkData.picture) {
    return { url: linkData.picture, source: 'creative_link_data' };
  }
  
  // 4순위: link_data.child_attachments에서 이미지 해시 (캐러셀)
  const childAttachments = linkData.child_attachments || [];
  if (childAttachments.length > 0) {
    for (const child of childAttachments) {
      const imgHash = child.image_hash;
      if (imgHash) {
        const imgUrl = meta_getImageUrlFromHash(imgHash, settings);
        if (imgUrl) {
          return { url: imgUrl, source: 'carousel_hash' };
        }
      }
    }
  }
  
  // 5순위: asset_feed_spec에서 이미지 해시 추출
  const assetFeed = data.asset_feed_spec || {};
  const images = assetFeed.images || [];
  if (images.length > 0) {
    for (const img of images) {
      const imgHash = img.hash;
      if (imgHash) {
        const imgUrl = meta_getImageUrlFromHash(imgHash, settings);
        if (imgUrl) {
          return { url: imgUrl, source: 'asset_feed_hash' };
        }
      }
    }
  }
  
  // 6순위: thumbnail_url 고해상도 (1200x1200 파라미터 적용됨 - Python 로직 추가)
  if (data.thumbnail_url) {
    return { url: data.thumbnail_url, source: 'thumbnail_hires' };
  }
  
  // 7순위: Instagram 연동 광고 - effective_instagram_media_id로 media_url 조회 (Python 로직 추가)
  const igMediaId = data.effective_instagram_media_id;
  if (igMediaId) {
    const igUrl = meta_getInstagramMediaUrl(igMediaId, settings);
    if (igUrl) {
      return { url: igUrl, source: 'instagram_media' };
    }
  }
  
  // 8순위: asset_feed_spec.videos는 URL 수정 시 서명이 깨지므로 제외 (Python과 동일)
  // Python 스크립트에서도 이 소스는 제거됨

  return null;
}

// ========================================
// Instagram Media URL 조회 (Python 로직 추가)
// ========================================

function meta_getInstagramMediaUrl(igMediaId, settings) {
  const url = `https://graph.facebook.com/${META_CONFIG.API_VERSION}/${igMediaId}?fields=media_type,media_url,thumbnail_url&access_token=${settings.token}`;

  try {
    const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });

    if (response.getResponseCode() !== 200) {
      return null;
    }

    const data = JSON.parse(response.getContentText());

    if (data.error) {
      return null;
    }

    // VIDEO 타입인 경우 thumbnail_url 사용 (media_url은 MP4 비디오)
    // IMAGE/CAROUSEL_ALBUM 타입인 경우 media_url 우선
    if (data.media_type === 'VIDEO') {
      return data.thumbnail_url || null;
    }

    return data.media_url || data.thumbnail_url || null;

  } catch (e) {
    Logger.log(`⚠️ Instagram Media 조회 오류 (${igMediaId}): ${e.message}`);
    return null;
  }
}

// ========================================
// Preview API Fallback (Python 로직 신규 추가)
// ========================================

function meta_fetchPreviewImagesBatch(ads, settings) {
  const adsWithoutImage = ads.filter(ad => !ad.imageUrl && ad.adId);
  
  if (adsWithoutImage.length === 0) {
    return;
  }
  
  Logger.log(`🔄 Preview API Fallback 대상: ${adsWithoutImage.length}개`);
  
  for (let i = 0; i < adsWithoutImage.length; i += META_CONFIG.PREVIEW_BATCH_SIZE) {
    const chunk = adsWithoutImage.slice(i, i + META_CONFIG.PREVIEW_BATCH_SIZE);
    Logger.log(`📦 배치 처리 중: ${i + 1} ~ ${i + chunk.length} / ${adsWithoutImage.length}`);
    
    // 병렬 요청 생성
    const requests = chunk.map(ad => ({
      url: `https://graph.facebook.com/${META_CONFIG.API_VERSION}/${ad.adId}/previews?ad_format=DESKTOP_FEED_STANDARD&access_token=${settings.token}`,
      method: 'GET',
      muteHttpExceptions: true
    }));
    
    try {
      const responses = UrlFetchApp.fetchAll(requests);
      
      responses.forEach((res, idx) => {
        const ad = chunk[idx];
        
        if (ad.imageUrl) return;
        
        if (res.getResponseCode() !== 200) {
          return;
        }
        
        try {
          const data = JSON.parse(res.getContentText());
          
          if (data.error || !data.data || data.data.length === 0) {
            return;
          }
          
          const body = data.data[0].body || '';
          if (!body) return;
          
          // iframe src URL 추출
          const iframeSrc = meta_extractIframeSrc(body);
          if (!iframeSrc) return;
          
          // iframe 콘텐츠에서 이미지 추출
          const imageUrl = meta_fetchImageFromIframe(iframeSrc);
          if (imageUrl) {
            ad.imageUrl = imageUrl;
            ad.imageSource = 'preview_iframe';
            Logger.log(`✅ Preview 성공: ${ad.adName.substring(0, 50)}`);
          }
          
        } catch (e) {
          // 개별 오류는 무시
        }
      });
      
    } catch (e) {
      Logger.log(`⚠️ Preview 배치 오류: ${e.message}`);
    }
    
    // 배치 간 딜레이
    if (i + META_CONFIG.PREVIEW_BATCH_SIZE < adsWithoutImage.length) {
      Utilities.sleep(META_CONFIG.API_DELAY * 2);
    }
  }
}

// ========================================
// iframe src 추출 (Python 로직)
// ========================================

function meta_extractIframeSrc(body) {
  // iframe src 패턴 매칭
  const iframeMatch = body.match(/<iframe[^>]+src=["']?([^"'>\s]+)["']?/i);
  if (!iframeMatch) return null;
  
  let iframeSrc = iframeMatch[1];
  // 이스케이프 문자 처리
  iframeSrc = iframeSrc.replace(/\\\//g, '/').replace(/&amp;/g, '&');
  
  return iframeSrc;
}

// ========================================
// iframe에서 이미지 URL 추출 (Python 로직)
// ========================================

function meta_fetchImageFromIframe(iframeSrc) {
  try {
    const response = UrlFetchApp.fetch(iframeSrc, {
      muteHttpExceptions: true,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (response.getResponseCode() !== 200) {
      return null;
    }
    
    const content = response.getContentText();
    
    // 1차: HTML 이미지 추출 함수 사용 (고해상도 점수 기반 정렬)
    const htmlImage = meta_extractImageFromHtml(content);
    if (htmlImage) {
      // URL 유효성 검증
      try {
        const testRes = UrlFetchApp.fetch(htmlImage, {
          method: 'HEAD',
          muteHttpExceptions: true,
          followRedirects: true
        });
        if (testRes.getResponseCode() === 200) {
          return htmlImage;
        }
      } catch (e) {
        // 검증 실패 시 계속 진행
      }
    }
    
    // 2차: scontent 이미지 URL 직접 추출 (fallback)
    const rawUrls = content.match(/https:\/\/scontent[^"'\s<>]+/g) || [];
    
    if (rawUrls.length === 0) {
      return null;
    }
    
    // URL 필터링 (Python 로직과 동일)
    const validUrls = [];
    for (const url of rawUrls) {
      const decoded = url.replace(/&amp;/g, '&');
      
      // 저해상도/아이콘 제외
      if (/p64x64|s64x64|p32x32|s32x32|emoji|icon/i.test(decoded)) {
        continue;
      }
      
      // keyframe 형식 제외
      if (decoded.includes('/m1/v/t6/')) {
        continue;
      }
      
      validUrls.push(decoded);
    }
    
    if (validUrls.length === 0) {
      return null;
    }
    
    // 고유 URL만 추출 및 해상도 점수 기반 정렬
    const uniqueUrls = [...new Set(validUrls)];
    uniqueUrls.sort((a, b) => meta_getResolutionScore(b) - meta_getResolutionScore(a));
    
    // URL 유효성 검증 (최대 3개까지 시도)
    for (let i = 0; i < Math.min(3, uniqueUrls.length); i++) {
      try {
        const testRes = UrlFetchApp.fetch(uniqueUrls[i], {
          method: 'HEAD',
          muteHttpExceptions: true,
          followRedirects: true
        });
        
        if (testRes.getResponseCode() === 200) {
          return uniqueUrls[i];
        }
      } catch (e) {
        continue;
      }
    }
    
    return null;
    
  } catch (e) {
    return null;
  }
}

// ========================================
// 이미지 해시로 URL 가져오기
// ========================================

function meta_getImageUrlFromHash(imageHash, settings) {
  const url = `https://graph.facebook.com/${META_CONFIG.API_VERSION}/${settings.accountId}/adimages?hashes=["${imageHash}"]&fields=url&access_token=${settings.token}`;
  
  try {
    const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    
    if (response.getResponseCode() !== 200) {
      return null;
    }
    
    const data = JSON.parse(response.getContentText());
    
    if (data.data && data.data.length > 0) {
      return data.data[0].url || null;
    }
  } catch (e) {
    Logger.log(`⚠️ 이미지 해시 조회 오류 (${imageHash}): ${e.message}`);
  }
  
  return null;
}

// ========================================
// [DEPRECATED] 썸네일 URL을 고해상도로 변환
// 주의: URL 파라미터 수정 시 서명이 깨져 403 오류 발생
// 이 함수는 더 이상 사용되지 않음 (Python과 동일)
// ========================================

// function meta_convertToHighRes(url) {
//   let highRes = url.replace(/_s\d+x\d+/g, '');
//   highRes = highRes.replace(/stp=dst-jpg_s\d+x\d+/g, 'stp=dst-jpg');
//   return highRes;
// }


// ========================================
// HTML에서 이미지 URL 추출 (Python 로직 추가)
// ========================================

function meta_decodeHtml(html) {
  if (!html) return '';
  
  let decoded = html;
  
  // 유니코드 이스케이프 처리
  if (html.includes('\\u')) {
    try {
      decoded = JSON.parse(`"${html}"`);
    } catch (e) {
      // 수동 변환
      decoded = html
        .replace(/\\u003c/g, '<')
        .replace(/\\u003e/g, '>')
        .replace(/\\u0022/g, '"')
        .replace(/\\u0027/g, "'")
        .replace(/\\\//g, '/')
        .replace(/\\n/g, '');
    }
  }
  
  // HTML 엔티티 변환
  decoded = decoded.replace(/&amp;/g, '&').replace(/&quot;/g, '"');
  
  return decoded;
}

function meta_extractImageFromHtml(html) {
  if (!html) return '';
  
  const decoded = meta_decodeHtml(html);
  const urls = [];
  
  // img 태그에서 src 추출
  const imgPattern = /<img[^>]+src=["']?(https?:\/\/[^"'\s>]+)["']?/gi;
  let match;
  while ((match = imgPattern.exec(decoded)) !== null) {
    urls.push(match[1]);
  }
  
  // background-image에서 url 추출
  const bgPattern = /background-image:\s*url\(["']?(https?:\/\/[^"')]+)["']?\)/gi;
  while ((match = bgPattern.exec(decoded)) !== null) {
    urls.push(match[1]);
  }
  
  // data-src 속성에서 추출
  const dataSrcPattern = /data-src=["']?(https?:\/\/[^"'\s>]+)["']?/gi;
  while ((match = dataSrcPattern.exec(decoded)) !== null) {
    urls.push(match[1]);
  }
  
  // style 내 url() 추출
  const styleUrlPattern = /url\(["']?(https?:\/\/[^"')]+)["']?\)/gi;
  while ((match = styleUrlPattern.exec(decoded)) !== null) {
    urls.push(match[1]);
  }
  
  // URL 정리 및 필터링
  const validUrls = [];
  const excludeKeywords = ['emoji', 'icon', 'logo', 'profile', 'avatar'];
  const excludeSizes = ['/p50x50/', '/p32x32/', '/p24x24/', '/s32x32/', '/t51.1-8/'];
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  const metaCdnDomains = ['scontent', 'fbcdn', 'facebook', 'fb.com', 'cdninstagram'];
  
  for (const url of urls) {
    const cleanUrl = url.replace(/&amp;/g, '&');
    
    // 아이콘, 이모지, 저화질 제외
    const lowerUrl = cleanUrl.toLowerCase();
    if (excludeKeywords.some(keyword => lowerUrl.includes(keyword))) {
      continue;
    }
    if (excludeSizes.some(size => cleanUrl.includes(size))) {
      continue;
    }
    
    // 이미지 확장자 또는 Meta CDN 도메인 확인
    const isImageExt = imageExtensions.some(ext => lowerUrl.includes(ext));
    const isMetaCdn = metaCdnDomains.some(domain => cleanUrl.includes(domain));
    
    if (isImageExt || isMetaCdn) {
      validUrls.push(cleanUrl);
    }
  }
  
  if (validUrls.length === 0) return '';
  
  // 해상도 점수 기반 정렬 (고화질 우선)
  validUrls.sort((a, b) => meta_getResolutionScore(b) - meta_getResolutionScore(a));
  
  return validUrls[0];
}

function meta_getResolutionScore(url) {
  // 고해상도 키워드
  if (['1080', 'p1080', 's1080', 'w1080'].some(k => url.includes(k))) return 100;
  if (['720', 'p720', 's720', 'w720'].some(k => url.includes(k))) return 80;
  if (['600', 'p600', 's600', 'w600'].some(k => url.includes(k))) return 60;
  if (['480', 'p480', 's480'].some(k => url.includes(k))) return 40;
  // 저해상도 페널티
  if (['/s150', '/p150', '/s130', '/p130', '/s100', '/p100'].some(k => url.includes(k))) return 5;
  return 30;
}

// ========================================
// 트리거 관리
// ========================================

function meta_createDailyTrigger() {
  meta_deleteTriggers();
  ScriptApp.newTrigger('meta_fetchAllAdImagesAuto')
    .timeBased()
    .everyDays(1)
    .atHour(META_CONFIG.DEFAULT_TRIGGER_HOUR)
    .create();
  meta_showAlert(`매일 오전 ${META_CONFIG.DEFAULT_TRIGGER_HOUR}시에 자동 실행됩니다.`);
}

function meta_deleteTriggers() {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction().includes('meta_fetchAllAdImages'))
    .forEach(t => ScriptApp.deleteTrigger(t));
}

function meta_deleteTriggersWithConfirm() {
  const ui = SpreadsheetApp.getUi();
  if (ui.alert('트리거 삭제', '자동 실행을 중지하시겠습니까?', ui.ButtonSet.YES_NO) === ui.Button.YES) {
    meta_deleteTriggers();
    ui.alert('✅ 삭제 완료');
  }
}

// ========================================
// 유틸리티
// ========================================

function meta_dateToTimestamp(dateStr) {
  if (!dateStr) return null;
  try {
    return Math.floor(new Date(dateStr).getTime() / 1000);
  } catch (e) {
    Logger.log(`⚠️ 잘못된 날짜 형식: ${dateStr}`);
    return null;
  }
}

function meta_showAlert(msg) {
  try {
    SpreadsheetApp.getUi().alert(msg);
  } catch (e) {
    Logger.log(msg);
  }
}

function meta_showGuide() {
  SpreadsheetApp.getUi().alert(`
📖 Meta 광고 이미지 수집 가이드 (v2.1 - Python 로직 완전 반영)

1️⃣ 설정: 광고계정 ID + 액세스 토큰 입력
2️⃣ 실행: 🚀 실행하기 클릭
3️⃣ 결과: 'RAW-메타-썸네일' 시트에 저장

✨ 이미지 수집 순서 (3단계 Fallback):

[Step 1: 기본 수집]
   1. creative.image_url
   2. video_data.image_url
   3. link_data.picture
   
[Step 2: Creative API Fallback]
   4. creative 직접 image_url
   5. object_story_spec.video_data
   6. object_story_spec.link_data
   7. 캐러셀 이미지 해시 → adimages API
   8. asset_feed_spec 이미지 해시
   9. thumbnail_url 고해상도 (1200x1200)
   10. Instagram Media API ★ 신규
   11. 비디오 썸네일 고해상도 변환

[Step 3: Preview API Fallback]
   12. HTML 이미지 추출 (고해상도 점수 정렬) ★ 신규
   13. Preview iframe에서 scontent 이미지 추출
   14. URL 유효성 검증 후 최종 확정

📌 Key: ad_name 기준으로 매핑됩니다.
📌 Rate limit 방지를 위한 자동 재시도 기능 포함
📌 고해상도 이미지 우선 수집 (점수 기반 정렬)
  `);
}
