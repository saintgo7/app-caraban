import nodemailer from 'nodemailer';
import logger from '../config/logger';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
};

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      logger.warn('Email service not configured. Skipping email send.');
      return;
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: `"⛺ Caraban 캠핑" <${process.env.SMTP_USER}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };

    await transporter.sendMail(mailOptions);
    logger.info(`Email sent successfully to ${options.to}`);
  } catch (error) {
    logger.error('Failed to send email:', error);
    throw error;
  }
};

// Email templates
export const emailTemplates = {
  // Reservation confirmation
  reservationConfirmation: (data: {
    userName: string;
    campsiteName: string;
    checkInDate: string;
    checkOutDate: string;
    totalPrice: number;
    reservationId: string;
  }) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">⛺ 예약이 확정되었습니다!</h2>
      <p>안녕하세요, ${data.userName}님!</p>
      <p><strong>${data.campsiteName}</strong> 예약이 성공적으로 완료되었습니다.</p>

      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">예약 정보</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0;"><strong>예약 번호:</strong></td>
            <td style="padding: 8px 0;">${data.reservationId}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>캠핑장:</strong></td>
            <td style="padding: 8px 0;">${data.campsiteName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>체크인:</strong></td>
            <td style="padding: 8px 0;">${data.checkInDate}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>체크아웃:</strong></td>
            <td style="padding: 8px 0;">${data.checkOutDate}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>총 금액:</strong></td>
            <td style="padding: 8px 0;">${new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
  }).format(data.totalPrice)}</td>
          </tr>
        </table>
      </div>

      <p>즐거운 캠핑 되세요!</p>
      <p style="color: #6b7280; font-size: 12px;">
        문의사항이 있으시면 언제든지 연락 주세요.
      </p>
    </div>
  `,

  // Reservation cancellation
  reservationCancellation: (data: {
    userName: string;
    campsiteName: string;
    reservationId: string;
  }) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc2626;">예약이 취소되었습니다</h2>
      <p>안녕하세요, ${data.userName}님!</p>
      <p><strong>${data.campsiteName}</strong> 예약이 취소되었습니다.</p>

      <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>예약 번호:</strong> ${data.reservationId}</p>
        <p>환불 처리는 3-5 영업일 내에 완료됩니다.</p>
      </div>

      <p>다음에 더 좋은 기회에 뵙기를 바랍니다.</p>
    </div>
  `,

  // Reservation reminder (1 day before check-in)
  reservationReminder: (data: {
    userName: string;
    campsiteName: string;
    checkInDate: string;
    checkInTime: string;
    address: string;
  }) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">⏰ 내일 체크인입니다!</h2>
      <p>안녕하세요, ${data.userName}님!</p>
      <p>내일은 <strong>${data.campsiteName}</strong> 체크인 날입니다.</p>

      <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">체크인 정보</h3>
        <p><strong>날짜:</strong> ${data.checkInDate}</p>
        <p><strong>시간:</strong> ${data.checkInTime}</p>
        <p><strong>주소:</strong> ${data.address}</p>
      </div>

      <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0;"><strong>준비물 체크리스트:</strong></p>
        <ul style="margin: 10px 0;">
          <li>신분증</li>
          <li>예약 확인서</li>
          <li>캠핑 장비</li>
        </ul>
      </div>

      <p>즐거운 캠핑 되세요! 🏕️</p>
    </div>
  `,

  // Review request
  reviewRequest: (data: {
    userName: string;
    campsiteName: string;
    reservationId: string;
    reviewUrl: string;
  }) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">캠핑은 어떠셨나요?</h2>
      <p>안녕하세요, ${data.userName}님!</p>
      <p><strong>${data.campsiteName}</strong> 이용은 만족스러우셨나요?</p>

      <p>소중한 후기를 남겨주시면 다른 캠퍼들에게 큰 도움이 됩니다.</p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.reviewUrl}"
           style="background-color: #2563eb; color: white; padding: 12px 30px;
                  text-decoration: none; border-radius: 6px; display: inline-block;">
          리뷰 작성하기
        </a>
      </div>

      <p style="color: #6b7280; font-size: 12px;">
        리뷰 작성 시 다음 이용 시 5% 할인 혜택을 드립니다!
      </p>
    </div>
  `,

  // Welcome email
  welcome: (data: { userName: string }) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #2563eb;">⛺ Caraban 캠핑에 오신 것을 환영합니다!</h1>
      <p>안녕하세요, ${data.userName}님!</p>
      <p>회원가입을 진심으로 환영합니다. 🎉</p>

      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Caraban 캠핑과 함께 할 수 있는 것들:</h3>
        <ul>
          <li>🏕️ 전국 각지의 다양한 캠핑장 예약</li>
          <li>⭐ 실시간 리뷰와 평점 확인</li>
          <li>❤️ 마음에 드는 캠핑장 즐겨찾기</li>
          <li>📱 간편한 예약 관리</li>
        </ul>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.WEB_URL || 'http://localhost:3000'}/campsites"
           style="background-color: #2563eb; color: white; padding: 12px 30px;
                  text-decoration: none; border-radius: 6px; display: inline-block;">
          캠핑장 둘러보기
        </a>
      </div>

      <p>즐거운 캠핑 되세요!</p>
    </div>
  `,
};
