import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import AddUserDialog from "@/app/(app)/users/AddUserDialog";
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
import { PERMISSIONS, ROLE_LABELS, type Role } from "@/lib/roles";
import { formatLocalDateTime } from "@/lib/formatters";

export const metadata = { title: "Pengguna" };

export default async function UsersPage() {
  const user = await requireUser();

  if (!PERMISSIONS.admin.includes(user.role as never)) {
    return (
      <>
        <PageHeader title="Pengguna" description="Akun staf dan hak akses." />
        <EmptyState
          title="Akses terbatas"
          description="Hanya Pemilik, General Manager, dan Admin Perangkat yang dapat mengelola pengguna."
        />
      </>
    );
  }

  const users = await prisma.user.findMany({
    where: { propertyId: user.propertyId },
    orderBy: { name: "asc" },
  });

  return (
    <>
      <PageHeader
        title="Pengguna"
        description="Setiap akun memiliki satu peran. Hak akses diperiksa di server, bukan hanya di tampilan."
        action={<AddUserDialog />}
      />
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Peran</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>MFA</TableHead>
                <TableHead>Login terakhir</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <p className="font-semibold text-theta-navy">{row.name}</p>
                    <p className="text-[13px] text-text-muted">{row.employeeCode ?? "-"}</p>
                  </TableCell>
                  <TableCell className="text-text-muted">{row.email}</TableCell>
                  <TableCell>{ROLE_LABELS[row.role as Role] ?? row.role}</TableCell>
                  <TableCell>
                    <StatusBadge
                      label={row.isActive ? "Aktif" : "Nonaktif"}
                      tone={row.isActive ? "success" : "neutral"}
                    />
                  </TableCell>
                  <TableCell className="text-text-muted">{row.mfaEnabled ? "Aktif" : "Nonaktif"}</TableCell>
                  <TableCell className="text-text-muted">
                    {row.lastLoginAt ? formatLocalDateTime(row.lastLoginAt) : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
