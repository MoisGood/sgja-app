import { DurableObject } from "cloudflare:workers";

const CORS_HEADERS = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type",
};

interface DataAdjunta {
	uid: string;
	tipo: "computador" | "movil";
	sessionId: string;
}

function cors(res: Response): Response {
	const headers = new Headers(res.headers);
	for (const [k, v] of Object.entries(CORS_HEADERS)) headers.set(k, v);
	return new Response(res.body, { status: res.status, headers });
}

export class SesionesManager extends DurableObject<Env> {
	private porUid = new Map<string, Map<string, WebSocket>>();

	async fetch(request: Request): Promise<Response> {
		const url = new URL(request.url);

		if (url.pathname === "/ws") {
			const pair = new WebSocketPair();
			const [client, server] = Object.values(pair);
			this.ctx.acceptWebSocket(server);
			return new Response(null, { status: 101, webSocket: client });
		}

		if (url.pathname === "/api/sesiones") {
			if (request.method === "OPTIONS") return cors(new Response(null, { status: 204 }));
			const resultado: { uid: string; tipo: string; sessionId: string }[] = [];
			for (const [uid, sessions] of this.porUid) {
				for (const [sessionId, ws] of sessions) {
					const att = ws.deserializeAttachment() as DataAdjunta | null;
					resultado.push({ uid, tipo: att?.tipo || "computador", sessionId });
				}
			}
			return cors(Response.json(resultado));
		}

		if (url.pathname === "/api/cerrar-sesion") {
			if (request.method === "OPTIONS") return cors(new Response(null, { status: 204 }));
			if (request.method !== "POST") return cors(new Response("Method not allowed", { status: 405 }));
			const body = await request.json() as { uid: string; sessionId?: string };
			const sessions = this.porUid.get(body.uid);
			if (!sessions) return cors(Response.json({ ok: false, error: "no sessions" }));

			let cerradas = 0;
			for (const [sid, ws] of sessions) {
				if (body.sessionId && sid !== body.sessionId) continue;
				try { ws.send(JSON.stringify({ tipoMsg: "kick", reason: "Cerrada por administrador" })); } catch {}
				try { ws.close(1000, "Cerrada por administrador"); } catch {}
				sessions.delete(sid);
				cerradas++;
			}
			if (sessions.size === 0) this.porUid.delete(body.uid);
			return cors(Response.json({ ok: true, cerradas }));
		}

		return new Response("Not found", { status: 404 });
	}

	async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
		try {
			const datos = JSON.parse(message as string);

			if (datos.tipoMsg === "registrar") {
				const { uid, tipo, sessionId } = datos as DataAdjunta;
				ws.serializeAttachment({ uid, tipo, sessionId } satisfies DataAdjunta);

				// KICK: cerrar sesiÃ³n anterior del mismo uid + tipo
				const sessions = this.porUid.get(uid);
				if (sessions) {
					for (const [sid, oldWs] of sessions) {
						if (sid === sessionId) continue;
						const att = oldWs.deserializeAttachment() as DataAdjunta | null;
						if (att?.tipo === tipo) {
							try { oldWs.send(JSON.stringify({ tipoMsg: "kick" })); } catch {}
							try { oldWs.close(1000, "SesiÃ³n duplicada"); } catch {}
							sessions.delete(sid);
						}
					}
				}

				if (!this.porUid.has(uid)) this.porUid.set(uid, new Map());
				this.porUid.get(uid)!.set(sessionId, ws);
			}
		} catch (e) {
			console.error("webSocketMessage error:", e);
		}
	}

	async webSocketClose(ws: WebSocket, code: number, reason: string) {
		try {
			const att = ws.deserializeAttachment() as DataAdjunta | null;
			if (!att) return;
			const sessions = this.porUid.get(att.uid);
			if (sessions) {
				sessions.delete(att.sessionId);
				if (sessions.size === 0) this.porUid.delete(att.uid);
			}
		} catch {}
	}
}

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const url = new URL(request.url);
		if (url.pathname === "/ws" || url.pathname === "/api/sesiones" || url.pathname === "/api/cerrar-sesion") {
			const stub = env.SESIONES_MANAGER.getByName("sgja-sesiones");
			return stub.fetch(request);
		}
		return cors(new Response("Servidor de sesiones SGJA activo", { status: 200 }));
	},
} satisfies ExportedHandler<Env>;

