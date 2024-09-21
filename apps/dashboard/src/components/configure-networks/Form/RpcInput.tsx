import { FormFieldSetup } from "@/components/blocks/FormFieldSetup";
import { Input } from "@/components/ui/input";
import type { UseFormReturn } from "react-hook-form";
import type { NetworkConfigFormData } from "../ConfigureNetworkForm";

export const RpcInput: React.FC<{
  form: UseFormReturn<NetworkConfigFormData>;
}> = ({ form }) => {
  const reg = form.register("rpcUrl", {
    required: true,
    validate: {
      isValidUrl: (value) => {
        try {
          new URL(value);
          return true;
        } catch {
          return false;
        }
      },
    },
  });

  return (
    <FormFieldSetup
      isRequired
      errorMessage={form.formState.errors.rpcUrl?.message}
      htmlFor="rpc-url"
      tooltip={undefined}
      label="RPC URL"
    >
      <Input
        id="rpc-url"
        autoComplete="off"
        placeholder="https://"
        type="url"
        className="bg-muted/50"
        {...reg}
      />

      <p className="text-sm text-muted-foreground mt-2 leading-normal">
        Only add RPC URL that you trust. Malicious RPCs can record activity and
        lie about the state of the network.
      </p>
    </FormFieldSetup>
  );
};
