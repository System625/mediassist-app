"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthContext } from "@/context/AuthContext";
import { db } from "@/firebase/config";
import { zodResolver } from "@hookform/resolvers/zod";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  pharmacyContact: string;
  startDate: string;
  endDate: string;
  times: string[];
}

interface FormValues {
  name: string;
  dosage: string;
  frequency: string;
  pharmacyContact: string;
  startDate: string;
  endDate: string;
  times: string[];
}

const medicationSchema = z.object({
  name: z.string().min(1, { message: "Name is required." }),
  dosage: z.string().min(1, { message: "Dosage is required." }),
  frequency: z.string().min(1, { message: "Frequency is required." }),
  pharmacyContact: z
    .string()
    .length(11, { message: "Pharmacy contact must be 11 digits." })
    .regex(/^\d+$/, "Pharmacy contact must only contain digits."),
  startDate: z.string().min(1, { message: "Start date is required." }),
  endDate: z.string().min(1, { message: "End date is required." }),
  times: z.array(z.string()).nonempty(),
});

export function MedicationsForm() {
  const form = useForm<FormValues>({
    resolver: zodResolver(medicationSchema),
    defaultValues: {
      name: "",
      dosage: "",
      frequency: "",
      pharmacyContact: "",
      startDate: "",
      endDate: "",
      times: [],
    },
  });

  const [medications, setMedications] = useState<Medication[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { user } = useAuthContext();

  const toggleForm = () => {
    setIsFormOpen(!isFormOpen);
  };

  useEffect(() => {
    const fetchMedications = async () => {
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setMedications(userData.medications || []);
        } else {
          await setDoc(userDocRef, { medications: [] });
          setMedications([]);
        }
      }
    };

    fetchMedications();
  }, [user]);

  const onSubmit = async (values: FormValues) => {
    try {
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        await updateDoc(userDocRef, {
          medications: [...medications, values],
        });
        setMedications([...medications, values]);
        form.reset();
      }
    } catch (error) {
      console.error("Error adding medication: ", error);
    } finally {
      toggleForm();
    }
  };

  return (
    <div>
      <Button onClick={toggleForm}>
        {isFormOpen ? "Close Form" : "Open Form"}
      </Button>

      {isFormOpen && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          }}
          onClick={() => setIsFormOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "white",
              padding: "20px",
              borderRadius: "8px",
            }}
          >
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-2 w-[80vw] sm:w-96"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Medication name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dosage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dosage</FormLabel>
                      <FormControl>
                        <Input placeholder="Dosage" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="frequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frequency</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            // Reset the times field based on the selected frequency
                            form.setValue(
                              "times",
                              Array.from({ length: parseInt(value) }).map(
                                () => ""
                              )
                            );
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue
                              placeholder="Select frequency"
                              {...field}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>Frequency</SelectLabel>
                              <SelectItem value="1">Once a day</SelectItem>
                              <SelectItem value="2">Twice a day</SelectItem>
                              <SelectItem value="3">Thrice a day</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pharmacyContact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pharmacy Contact</FormLabel>
                      <FormControl>
                        <Input placeholder="Pharmacy Contact" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/** Dynamic time inputs based on frequency */}
                {form.watch("frequency") && (
                  <FormItem>
                    <FormLabel>Times</FormLabel>
                    <div className="flex space-x-2">
                      {[...Array(parseInt(form.watch("frequency") || "0"))].map(
                        (_, index) => (
                          <FormField
                            key={index}
                            control={form.control}
                            name={`times.${index}`}
                            render={({ field }) => (
                              <FormControl>
                                <Input type="time" {...field} />
                              </FormControl>
                            )}
                          />
                        )
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
                <div className="flex justify-center pt-3">
                <Button type="submit">Add Medication</Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      )}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {medications.map((med, index) => (
          <div key={index} className="p-4 border rounded-md">
            <h2 className="text-xl font-bold">{med.name}</h2>
            <p>Dosage: {med.dosage}</p>
            <p>
              Frequency: {med.frequency}{" "}
              {med.frequency === "1" ? "time" : "times"} per day
            </p>
            <p>Times: {med.times && med.times.join(", ")}</p>

            <p>Start Date: {med.startDate}</p>
            <p>End Date: {med.endDate}</p>
            <a
              href={`tel:${med.pharmacyContact}`}
              className="text-blue-500 underline"
            >
              Contact Pharmacy
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
