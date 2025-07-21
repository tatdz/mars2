import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useWallet } from "@/hooks/useWallet";
import { useContracts } from "@/hooks/useContracts";
import { generateNullifier, generateEventId, formatAddress } from "@/lib/crypto";
import { Validator } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, AlertTriangle } from "lucide-react";

const reportSchema = z.object({
  validator: z.string().min(1, "Please select a validator"),
  incidentType: z.string().min(1, "Please select an incident type"),
  impact: z.number().min(-50).max(0),
  description: z.string().min(10, "Description must be at least 10 characters"),
});

type ReportFormData = z.infer<typeof reportSchema>;

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  validatorAddress: string | null;
  validators: Validator[];
}

const incidentTypes = [
  { value: "missed_blocks", label: "Missed blocks (>10 in 1 hour)", impact: -20 },
  { value: "validator_jailed", label: "Validator jailed", impact: -40 },
  { value: "downtime_event", label: "Downtime event", impact: -30 },
  { value: "double_signing", label: "Double signing", impact: -50 },
  { value: "network_disruption", label: "Other network disruption", impact: -10 },
];

export function ReportModal({ isOpen, onClose, validatorAddress, validators }: ReportModalProps) {
  const { address, isConnected } = useWallet();
  const { submitAttestation, isSubmitting } = useContracts();
  const [selectedImpact, setSelectedImpact] = useState<number>(-10);

  const form = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      validator: validatorAddress || "",
      incidentType: "",
      impact: -10,
      description: "",
    },
  });

  const onSubmit = async (data: ReportFormData) => {
    if (!address || !isConnected) {
      return;
    }

    try {
      const eventId = generateEventId(data.validator, data.incidentType);
      const nullifier = generateNullifier(address, eventId);

      await submitAttestation.mutateAsync({
        nullifier,
        validator: data.validator,
        impact: data.impact,
        reason: `${data.incidentType}: ${data.description}`,
      });

      form.reset();
      onClose();
    } catch (error) {
      console.error("Failed to submit report:", error);
    }
  };

  const handleIncidentTypeChange = (value: string) => {
    const incident = incidentTypes.find(type => type.value === value);
    if (incident) {
      setSelectedImpact(incident.impact);
      form.setValue("impact", incident.impact);
    }
    form.setValue("incidentType", value);
  };

  const getImpactColor = (impact: number) => {
    if (impact <= -40) return "text-validator-red";
    if (impact <= -20) return "text-validator-yellow";
    return "text-orange-400";
  };

  const getImpactLabel = (impact: number) => {
    if (impact <= -40) return "Critical";
    if (impact <= -20) return "Major";
    return "Minor";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-dark-card border-gray-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Report Incident</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="validator"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Validator</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-dark-bg border-gray-600 text-white">
                        <SelectValue placeholder="Select a validator" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-dark-bg border-gray-600">
                      {validators.map((validator) => (
                        <SelectItem 
                          key={validator.operator_address} 
                          value={validator.operator_address}
                          className="text-white hover:bg-gray-700"
                        >
                          {validator.description.moniker} ({formatAddress(validator.operator_address)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="incidentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Incident Type</FormLabel>
                  <Select onValueChange={handleIncidentTypeChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-dark-bg border-gray-600 text-white">
                        <SelectValue placeholder="Select incident type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-dark-bg border-gray-600">
                      {incidentTypes.map((type) => (
                        <SelectItem 
                          key={type.value} 
                          value={type.value}
                          className="text-white hover:bg-gray-700"
                        >
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <FormLabel>Impact Score</FormLabel>
              <div className="mt-2">
                <div className={`inline-flex items-center px-3 py-2 rounded-lg bg-opacity-20 ${getImpactColor(selectedImpact)} bg-current`}>
                  <span className="font-semibold">
                    {selectedImpact} ({getImpactLabel(selectedImpact)})
                  </span>
                </div>
              </div>
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      className="bg-dark-bg border-gray-600 text-white resize-none"
                      placeholder="Describe the incident..."
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Alert className="bg-dark-bg border-validator-yellow">
              <Info className="h-4 w-4 text-validator-yellow" />
              <AlertDescription className="text-sm text-gray-300">
                <div className="font-medium text-validator-yellow mb-1">Anonymous Reporting</div>
                Your report will be submitted anonymously using zero-knowledge proofs. 
                Only one report per wallet per incident is allowed.
              </AlertDescription>
            </Alert>

            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 border-gray-600 hover:bg-gray-500"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!isConnected || isSubmitting}
                className="flex-1 bg-sei-blue hover:bg-sei-dark-blue"
              >
                {isSubmitting ? "Submitting..." : "Submit Report"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
