import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { PERMISSIONS } from "@/lib/roles";
import { formatLocalDateTime } from "@/lib/formatters";

export const metadata = { title: "Audit" };

export default async function AuditPage() {
  const user = await requireUser();

  if (!PERMISSIONS.auditView.includes(user.role as never)) {
    return (
      <>
        <PageHeader title="Audit" description="Riwayat tindakan pengguna pada sistem." />
        <EmptyState
          title="Akses terbatas"
          description="Hanya Pemilik, General Manager, dan Auditor yang dapat melihat log audit."
        />
      </>
    );
  }

  const logs = await prisma.applicationAuditLog.findMany({
    where: { propertyId: user.propertyId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <>
      <PageHeader
        title="Audit"
        description="Catatan tindakan aplikasi. Log tidak menyimpan kata sandi maupun token."
      />
      <Card>
        <CardContent className="p-0">
          {logs.length === 0 ? (
            <EmptyState title="Belum ada catatan" description="Log akan terisi saat pengguna melakukan tindakan." className="border-0" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Pelaku</TableHead>
                  <TableHead>Aksi</TableHead>
                  <TableHead>Objek</TableHead>
                  <TableHead>Ringkasan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap text-[13px] text-text-muted">
                      {formatLocalDateTime(log.createdAt)}
                    </TableCell>
                    <TableCell className="font-medium text-theta-navy">{log.actorName ?? "sistem"}</TableCell>
                    <TableCell className="font-mono text-[13px] text-text-muted">{log.action}</TableCell>
                    <TableCell className="text-text-muted">
                      {log.entityType}
                      {log.entityId ? ` · ${log.entityId.slice(0, 8)}` : ""}
                    </TableCell>
                    <TableCell className="text-text-muted">{log.summary ?? "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}

