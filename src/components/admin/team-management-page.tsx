"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Therapist } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Plus, 
  Search, 
  Edit, 
  UserX, 
  UserCheck,
  Star,
  Calendar,
  Mail,
} from "lucide-react";
import { TeamMemberModal } from "./team-member-modal";
import { cn } from "@/lib/utils";

interface TeamManagementPageProps {
  currentUser: Therapist;
}

type TeamMemberWithStats = Therapist & {
  total_appointments?: number;
  completed_appointments?: number;
};

export function TeamManagementPage({ currentUser }: TeamManagementPageProps) {
  const [team, setTeam] = useState<TeamMemberWithStats[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMemberWithStats | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  const fetchTeam = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (showInactive) params.set("include_inactive", "true");
      
      const response = await fetch(`/api/admin/team?${params}`);
      const data = await response.json();
      
      if (data.team) {
        setTeam(data.team);
      }
    } catch (error) {
      console.error("Error fetching team:", error);
    } finally {
      setLoading(false);
    }
  }, [showInactive]);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  const filteredTeam = team.filter(member => 
    member.name.toLowerCase().includes(search.toLowerCase()) ||
    member.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddMember = () => {
    setSelectedMember(null);
    setShowModal(true);
  };

  const handleEditMember = (member: TeamMemberWithStats) => {
    setSelectedMember(member);
    setShowModal(true);
  };

  const handleToggleActive = async (member: TeamMemberWithStats) => {
    try {
      const response = await fetch(`/api/admin/team/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !member.active }),
      });

      if (response.ok) {
        fetchTeam();
      }
    } catch (error) {
      console.error("Error toggling member status:", error);
    }
  };

  const handleSave = () => {
    setShowModal(false);
    setSelectedMember(null);
    fetchTeam();
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "super_admin":
        return <Badge className="bg-purple-100 text-purple-800">Super Admin</Badge>;
      case "admin":
        return <Badge className="bg-blue-100 text-blue-800">Admin</Badge>;
      case "therapist":
        return <Badge className="bg-green-100 text-green-800">Terapeuta</Badge>;
      default:
        return <Badge>{role}</Badge>;
    }
  };

  const activeCount = team.filter(m => m.active).length;
  const adminCount = team.filter(m => m.role === "admin" || m.role === "super_admin").length;
  const therapistCount = team.filter(m => m.role === "therapist" && m.active).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-800">
            Gestión del Equipo
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Administra los miembros del equipo y sus roles
          </p>
        </div>
        <Button onClick={handleAddMember}>
          <Plus className="h-4 w-4 mr-1" />
          Agregar miembro
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand/10 rounded-lg">
                <Users className="h-5 w-5 text-brand" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeCount}</p>
                <p className="text-sm text-neutral-500">Miembros activos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <UserCheck className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{therapistCount}</p>
                <p className="text-sm text-neutral-500">Terapeutas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Star className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{adminCount}</p>
                <p className="text-sm text-neutral-500">Administradores</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <UserX className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{team.length - activeCount}</p>
                <p className="text-sm text-neutral-500">Inactivos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team List */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Equipo
            </CardTitle>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={showInactive}
                  onChange={(e) => setShowInactive(e.target.checked)}
                  className="rounded"
                />
                Mostrar inactivos
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <Input
                  placeholder="Buscar..."
                  className="pl-10 w-60"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-neutral-500">
              Cargando equipo...
            </div>
          ) : filteredTeam.length === 0 ? (
            <div className="text-center py-12 text-neutral-500">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>No se encontraron miembros</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTeam.map((member) => (
                <div
                  key={member.id}
                  className={cn(
                    "flex items-center justify-between p-4 border rounded-lg",
                    !member.active && "opacity-60 bg-neutral-50"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center">
                      {member.photo_url ? (
                        <Image
                          src={member.photo_url}
                          alt={member.name}
                          width={48}
                          height={48}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-lg font-semibold text-brand">
                          {member.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-neutral-800">{member.name}</p>
                        {getRoleBadge(member.role)}
                        {!member.active && (
                          <Badge variant="outline" className="text-red-600 border-red-200">
                            Inactivo
                          </Badge>
                        )}
                        {member.id === currentUser.id && (
                          <Badge variant="outline">Tú</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-neutral-500">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {member.email}
                        </span>
                        {member.hire_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Desde {new Date(member.hire_date).toLocaleDateString("es-CL", { month: "short", year: "numeric" })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {member.total_appointments !== undefined && (
                      <div className="text-right text-sm">
                        <p className="font-medium">{member.completed_appointments || 0}</p>
                        <p className="text-neutral-500">citas completadas</p>
                      </div>
                    )}
                    
                    {member.id !== currentUser.id && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditMember(member)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleActive(member)}
                          className={member.active ? "text-red-600 hover:text-red-700" : "text-green-600 hover:text-green-700"}
                        >
                          {member.active ? (
                            <UserX className="h-4 w-4" />
                          ) : (
                            <UserCheck className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Team Member Modal */}
      {showModal && (
        <TeamMemberModal
          member={selectedMember}
          onClose={() => {
            setShowModal(false);
            setSelectedMember(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
