
'use client'
import { useRef, useState, useEffect } from "react";
import Hls from "hls.js";
const m3u8Url = 'https://sample-practice-app.s3.ap-northeast-1.amazonaws.com/m3u8/freeMovie/freeMovie.m3u8'

export default function M3u8ForOtherThanPC() {
  const videoEl = useRef<HTMLVideoElement>(null);
  const [hls, setHls] = useState<Hls | null>(null);
  const [error,setError] = useState('');
  const [errCount,setErrCount] = useState(0);//無限にリカバリーされるのを防ぐ

  useEffect(() => {
    const meinVideo:HTMLVideoElement|null = videoEl.current;
    if (meinVideo && !hls) {
      const hlsInstance = new Hls();

      //<video>にhls.jsをアタッチ完了後に発火
      hlsInstance.on(Hls.Events.MEDIA_ATTACHED, () => {
        //m3u8を読み込み
        hlsInstance.loadSource(m3u8Url);
      });

      //m3u8読み込みからの～解析完了時に発火
      //hlsInstance.on(Hls.Events.MANIFEST_PARSED, function (event, data) {----});

      //<video>にhls.jsをアタッチ
      hlsInstance.attachMedia(meinVideo);

      hlsInstance.on(Hls.Events.ERROR, function (event, data) {
        if (data.fatal && errCount<2) {
          switch (data.type) {
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.log('fatal media error encountered, try to recover');
              if(errCount<1){
                hlsInstance.recoverMediaError();
              }else{
                hlsInstance.swapAudioCodec();//オーディオ コーデックの不一致を回避するのに役立つ可能性があります。
                hlsInstance.recoverMediaError();
              }
              setErrCount((preve)=>preve+1);
              break;
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error('fatal network error encountered', data);
              break;
            default:
              // cannot recover
              console.log(`cannot recover：${JSON.stringify(data)}`);
              setError(data.error.message);
              hlsInstance.destroy();
              break;
          }
        }
      });
      setHls(hlsInstance);
    }

    return () => {
        if(hls){
            hls.stopLoad();
            hls.destroy();
        }
    };
  }, [hls,errCount]);
 
  return (<>
    {error && <p style={{color:'red'}}>{error}</p>}
    <h1 style={{textAlign:'center'}}>MP4動画をM3U8動画に変換！！HLS配信！！</h1>
    <div style={{textAlign:'center'}}>
      <video
        ref={videoEl}
        id="video"
        playsInline={true}
        width={350}
        height={280}
        controls={true}
      />
    </div>
  </>);
}
