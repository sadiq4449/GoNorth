import { useEffect, useRef } from 'react'
import QRCode from 'qrcode'

export default function QrVoucher({ token, reference }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!canvasRef.current || !token) return
    QRCode.toCanvas(canvasRef.current, token, { width: 160, margin: 1, color: { dark: '#0b2545' } })
  }, [token])

  return (
    <div className="qr-wrap">
      <canvas ref={canvasRef} aria-label={`QR voucher ${reference}`} />
      <p className="qr-ref">{reference}</p>
    </div>
  )
}
