import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { sendSMS } from "@/lib/sms/service";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { phoneNumber, message } = await request.json();

    if (! phoneNumber || !message) {
      return NextResponse.json(
        { error: "Telefone e mensagem são obrigatórios" },
        { status: 400 }
      );
    }

    const result = await sendSMS({ phoneNumber, message });

    if (! result.success) {
      return NextResponse.json(
        { error: result.error || "Falha ao enviar SMS" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, messageId: result.messageId });
  } catch (error) {
    console.error("Error sending SMS:", error);
    return NextResponse.json(
      { error: "Erro ao enviar SMS" },
      { status: 500 }
    );
  }
}