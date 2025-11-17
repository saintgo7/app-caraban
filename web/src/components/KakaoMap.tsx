import React, { useEffect, useRef } from 'react';

interface KakaoMapProps {
  latitude: number;
  longitude: number;
  level?: number;
  markerTitle?: string;
  width?: string;
  height?: string;
  className?: string;
}

const KakaoMap: React.FC<KakaoMapProps> = ({
  latitude,
  longitude,
  level = 3,
  markerTitle,
  width = '100%',
  height = '400px',
  className = '',
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapContainer.current || !window.kakao) {
      console.warn('Kakao Maps API not loaded');
      return;
    }

    const { kakao } = window;

    // 지도 옵션
    const options = {
      center: new kakao.maps.LatLng(latitude, longitude),
      level: level,
    };

    // 지도 생성
    const map = new kakao.maps.Map(mapContainer.current, options);

    // 마커 생성
    const markerPosition = new kakao.maps.LatLng(latitude, longitude);
    const marker = new kakao.maps.Marker({
      position: markerPosition,
    });

    marker.setMap(map);

    // 마커에 타이틀 추가 (인포윈도우)
    if (markerTitle) {
      const infowindow = new kakao.maps.InfoWindow({
        content: `<div style="padding:5px;font-size:12px;">${markerTitle}</div>`,
      });
      infowindow.open(map, marker);
    }

    // 지도 컨트롤 추가
    const mapTypeControl = new kakao.maps.MapTypeControl();
    map.addControl(mapTypeControl, kakao.maps.ControlPosition.TOPRIGHT);

    const zoomControl = new kakao.maps.ZoomControl();
    map.addControl(zoomControl, kakao.maps.ControlPosition.RIGHT);
  }, [latitude, longitude, level, markerTitle]);

  return (
    <div
      ref={mapContainer}
      style={{ width, height }}
      className={`rounded-lg ${className}`}
    />
  );
};

export default KakaoMap;
