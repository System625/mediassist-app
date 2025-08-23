"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  getDoc,
} from "firebase/firestore";
import { db } from "@/firebase/config";
// import { useAuth } from "@/contexts/AuthContext"; // Assuming you have an AuthContext

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthContext } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface Patient {
  id: string;
  name: string;
  email: string;
  address: string;
  age: number;
  condition: string;
  hospitalNumber: string;
}

interface NewPatient {
  hospitalNumber: string;
  condition: string;
}

export default function DoctorPatientsPage() {
  const { user, role } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push("/login");
    } else if (role === "patient") {
      router.push("/protected/patient");
    }
  }, [user, role, router]);

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [newPatient, setNewPatient] = useState<NewPatient>({
    hospitalNumber: "",
    condition: "",
  });
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const fetchPatients = async () => {
      if (user) {
        const doctorRef = doc(db, "users", user.uid);
        const doctorSnap = await getDoc(doctorRef);
        if (doctorSnap.exists()) {
          const patientIds = doctorSnap.data().patients || [];
          const patientPromises = patientIds.map((id: string) =>
            getDoc(doc(db, "users", id))
          );
          const patientDocs = await Promise.all(patientPromises);
          const patientData = patientDocs.map(
            (doc) => ({ id: doc.id, ...doc.data() } as Patient)
          );
          setPatients(patientData);
        }
      }
    };
    fetchPatients();
  }, [user]);

  const handleSearchPatient = async (
    hospitalNumber: string
  ): Promise<Patient | undefined> => {
    console.log("Searching for patient with hospital number:", hospitalNumber);
    try {
      const querySnapshot = await getDocs(
        query(
          collection(db, "users"),
          where("hospitalNumber", "==", hospitalNumber)
        )
      );

      console.log("Query snapshot empty:", querySnapshot.empty);

      if (!querySnapshot.empty) {
        console.log("Patient found:", querySnapshot.docs[0].data());
        const patientData = querySnapshot.docs[0].data() as Omit<Patient, "id">;
        console.log("Patient found:", patientData);
        return { id: querySnapshot.docs[0].id, ...patientData };
      } else {
        console.log("No patient found with the given hospital number");
        return undefined;
      }
    } catch (error) {
      console.error("Error searching for patient:", error);
      return undefined;
    }
  };

  const handleAddPatient = async () => {
    if (!user) return;
    
    // Validation
    if (!newPatient.hospitalNumber.trim()) {
      toast.error("Please enter a hospital number");
      return;
    }
    if (!newPatient.condition.trim()) {
      toast.error("Please enter the patient's condition");
      return;
    }

    setIsLoading(true);
    try {
      const patientData = await handleSearchPatient(newPatient.hospitalNumber);
      if (patientData) {
        // Check if patient is already added
        const isPatientAlreadyAdded = patients.some(p => p.id === patientData.id);
        if (isPatientAlreadyAdded) {
          toast.error("This patient is already in your list");
          setIsLoading(false);
          return;
        }

        const doctorRef = doc(db, "users", user.uid);
        await updateDoc(doctorRef, {
          patients: arrayUnion(patientData.id),
        });

        const updatedPatientData = {
          ...patientData,
          condition: newPatient.condition,
        };
        setPatients([...patients, updatedPatientData]);

        setNewPatient({ hospitalNumber: "", condition: "" });
        setDialogOpen(false);
        toast.success(`Patient ${patientData.name} added successfully!`);
      } else {
        toast.error("No patient found with this hospital number. Please verify the number and try again.");
      }
    } catch (error) {
      console.error("Error adding patient:", error);
      toast.error("Failed to add patient. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemovePatient = async (patientId: string) => {
    if (!user) return;
    
    const patientName = patients.find(p => p.id === patientId)?.name;
    
    try {
      const doctorRef = doc(db, "users", user.uid);
      await updateDoc(doctorRef, {
        patients: arrayRemove(patientId),
      });

      setPatients(patients.filter((p) => p.id !== patientId));
      toast.success(`Patient ${patientName || ''} removed from your list`);
    } catch (error) {
      console.error("Error removing patient:", error);
      toast.error("Failed to remove patient. Please try again.");
    }
  };

  const handleEditCondition = async (
    patientId: string,
    newCondition: string
  ) => {
    if (!newCondition.trim()) {
      toast.error("Condition cannot be empty");
      return;
    }

    try {
      const patientRef = doc(db, "users", patientId);
      await updateDoc(patientRef, { condition: newCondition });

      setPatients(
        patients.map((p) =>
          p.id === patientId ? { ...p, condition: newCondition } : p
        )
      );
      toast.success("Patient condition updated successfully");
    } catch (error) {
      console.error("Error updating patient condition:", error);
      toast.error("Failed to update patient condition. Please try again.");
    }
  };

  const filteredPatients = patients.filter(
    (patient) =>
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Patient List</h1>
      <div className="flex mb-4">
        <Input
          type="text"
          placeholder="Search patients..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mr-2"
        />
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>Add Patient</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Patient</DialogTitle>
              <DialogDescription>
                Enter the patient&apos;s hospital number and current condition to add
                them to your patient list. The hospital number should match the one 
                provided to the patient during registration.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Hospital Number</label>
                <Input
                  type="text"
                  placeholder="e.g., ABC123DEF456"
                  value={newPatient.hospitalNumber}
                  onChange={(e) =>
                    setNewPatient({ ...newPatient, hospitalNumber: e.target.value })
                  }
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Patients can find this number in their profile section
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Current Condition</label>
                <Input
                  type="text"
                  placeholder="e.g., Hypertension, Diabetes, etc."
                  value={newPatient.condition}
                  onChange={(e) =>
                    setNewPatient({ ...newPatient, condition: e.target.value })
                  }
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button 
                variant="outline" 
                onClick={() => setDialogOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAddPatient}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                    Adding...
                  </>
                ) : (
                  "Add Patient"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>E-mail</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>Age</TableHead>
            <TableHead>Condition</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredPatients.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8">
                <div className="text-gray-500">
                  <p className="text-lg font-medium">No patients found</p>
                  <p className="text-sm">
                    {searchTerm ? "Try adjusting your search term" : "Add patients to see them here"}
                  </p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            filteredPatients.map((patient) => (
            <TableRow key={patient.id}>
              <TableCell>{patient.name}</TableCell>
              <TableCell>{patient.email}</TableCell>
              <TableCell>{patient.address}</TableCell>
              <TableCell>{patient.age}</TableCell>
              <TableCell>{patient.condition}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      Actions
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>
                      <Link href={`/protected/doctor/patients/${patient.id}`}>
                        View Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => {
                        const newCondition = prompt(
                          "Enter new condition:",
                          patient.condition
                        );
                        if (newCondition && newCondition.trim())
                          handleEditCondition(patient.id, newCondition);
                      }}
                    >
                      Edit Condition
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => {
                        if (confirm(`Are you sure you want to remove ${patient.name} from your patient list?`)) {
                          handleRemovePatient(patient.id);
                        }
                      }}
                      className="text-red-600 focus:text-red-600"
                    >
                      Remove Patient
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          )))}
        </TableBody>
      </Table>
    </div>
  );
}
