import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Plus, Eye, Edit, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { toast } from 'sonner';
import api from '../lib/api';

export default function Users() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/users/${selectedUser.id}`);
      toast.success('User deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete user');
    }
  };

  const openDeleteDialog = (user) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="p-8 space-y-8" data-testid="users-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight" style={{ fontFamily: 'Space Grotesk' }}>Users</h1>
          <p className="text-[color:var(--fg-secondary)] mt-2">Manage system users and access</p>
        </div>
        <Button 
          onClick={() => navigate('/users/create')}
          data-testid="create-user-button" 
          className="bg-emerald-500 text-black hover:bg-emerald-400 font-medium gap-2 shadow-lg shadow-emerald-500/20"
        >
          <Plus size={16} /> Add User
        </Button>
      </div>

      <Card className="bg-[color:var(--bg-elevated)] border-[color:var(--border-default)] shadow-[var(--shadow-soft)]">
        <Table data-testid="users-table">
          <TableHeader>
            <TableRow className="border-[color:var(--border-default)] hover:bg-transparent">
              <TableHead className="text-[color:var(--fg-secondary)]">Name</TableHead>
              <TableHead className="text-[color:var(--fg-secondary)]">Email</TableHead>
              <TableHead className="text-[color:var(--fg-secondary)]">Role</TableHead>
              <TableHead className="text-[color:var(--fg-secondary)]">Created</TableHead>
              <TableHead className="text-[color:var(--fg-secondary)] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-[color:var(--fg-secondary)]">Loading...</TableCell>
              </TableRow>
            ) : users.length > 0 ? (
              users.map((user) => (
                <TableRow key={user.id} className="border-[color:var(--border-default)] hover:bg-white/5" data-testid={`user-row-${user.id}`}>
                  <TableCell className="font-medium text-[color:var(--fg-primary)]">{user.name}</TableCell>
                  <TableCell className="text-[color:var(--fg-secondary)]">{user.email}</TableCell>
                  <TableCell>
                    <Badge className="bg-[color:var(--info)]/10 text-[color:var(--info)] border-[color:var(--info)]/20">
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[color:var(--fg-secondary)]">
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/users/${user.id}`)}
                        data-testid={`view-user-${user.id}`}
                        className="hover:bg-white/10"
                      >
                        <Eye size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDeleteDialog(user)}
                        data-testid={`delete-user-${user.id}`}
                        className="hover:bg-red-500/10 text-[color:var(--error)]"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-[color:var(--fg-secondary)]">No users found</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-[color:var(--bg-elevated)] border-[color:var(--border-default)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[color:var(--fg-primary)]">Delete User</AlertDialogTitle>
            <AlertDialogDescription className="text-[color:var(--fg-secondary)]">
              Are you sure you want to delete &quot;{selectedUser?.name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-[color:var(--border-default)] hover:bg-white/5">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              data-testid="confirm-delete-user"
              className="bg-[color:var(--error)] hover:bg-red-600 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
