import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Form } from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  allergyTypes,
  smokingTypes,
  type AllergyType,
  type SmokingType,
  type TalentProfileData,
  talentProfileSchema,
} from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, X, Tag } from "lucide-react";

// HealthOptions component
interface HealthOptionsProps {
  allergies: {
    types: AllergyType[];
    others: string[];
    hasAllergy: boolean;
  };
  onAllergiesChange: (allergies: {
    types: AllergyType[];
    others: string[];
    hasAllergy: boolean;
  }) => void;
  smoking: {
    enabled: boolean;
    types: SmokingType[];
    others: string[];
  };
  onSmokingChange: (smoking: {
    enabled: boolean;
    types: SmokingType[];
    others: string[];
  }) => void;
}

const HealthOptions: React.FC<HealthOptionsProps> = ({
  allergies,
  onAllergiesChange,
  smoking,
  onSmokingChange,
}) => {
  const [otherAllergies, setOtherAllergies] = useState<string[]>(allergies.others);
  const [otherSmokingTypes, setOtherSmokingTypes] = useState<string[]>(smoking.others);

  const handleOtherAllergyAdd = (allergy: string) => {
    if (allergy.trim() && !otherAllergies.includes(allergy)) {
      const newAllergies = [...otherAllergies, allergy];
      setOtherAllergies(newAllergies);
      onAllergiesChange({ ...allergies, others: newAllergies });
    }
  };

  const handleOtherAllergyRemove = (allergy: string) => {
    const newAllergies = otherAllergies.filter(a => a !== allergy);
    setOtherAllergies(newAllergies);
    onAllergiesChange({ ...allergies, others: newAllergies });
  };

  const handleOtherSmokingTypeAdd = (type: string) => {
    if (type.trim() && !otherSmokingTypes.includes(type)) {
      const newTypes = [...otherSmokingTypes, type];
      setOtherSmokingTypes(newTypes);
      onSmokingChange({ ...smoking, others: newTypes });
    }
  };

  const handleOtherSmokingTypeRemove = (type: string) => {
    const newTypes = otherSmokingTypes.filter(t => t !== type);
    setOtherSmokingTypes(newTypes);
    onSmokingChange({ ...smoking, others: newTypes });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>アレルギーの有無</Label>
          <Switch
            checked={allergies.hasAllergy}
            onCheckedChange={(checked) => {
              onAllergiesChange({ ...allergies, hasAllergy: checked });
            }}
          />
        </div>

        {allergies.hasAllergy && (
          <>
            <div className="grid grid-cols-2 gap-4">
              {allergyTypes.map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    checked={allergies.types.includes(type)}
                    onCheckedChange={(checked) => {
                      const newTypes = checked
                        ? [...allergies.types, type]
                        : allergies.types.filter(t => t !== type);
                      onAllergiesChange({ ...allergies, types: newTypes });
                    }}
                  />
                  <label className="text-sm">{type}</label>
                </div>
              ))}
            </div>

            <div>
              <Label>その他のアレルギー</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {otherAllergies.map((allergy) => (
                  <Badge key={allergy} variant="secondary">
                    {allergy}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="ml-1 h-4 w-4 p-0"
                      onClick={() => handleOtherAllergyRemove(allergy)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="その他のアレルギーを入力"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleOtherAllergyAdd(e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={(e) => {
                    const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                    handleOtherAllergyAdd(input.value);
                    input.value = '';
                  }}
                >
                  追加
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>喫煙の有無</Label>
          <Switch
            checked={smoking.enabled}
            onCheckedChange={(checked) => {
              onSmokingChange({ ...smoking, enabled: checked });
            }}
          />
        </div>

        {smoking.enabled && (
          <>
            <div className="grid grid-cols-2 gap-4">
              {smokingTypes.map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    checked={smoking.types.includes(type)}
                    onCheckedChange={(checked) => {
                      const newTypes = checked
                        ? [...smoking.types, type]
                        : smoking.types.filter(t => t !== type);
                      onSmokingChange({ ...smoking, types: newTypes });
                    }}
                  />
                  <label className="text-sm">{type}</label>
                </div>
              ))}
            </div>

            <div>
              <Label>その他の喫煙種類</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {otherSmokingTypes.map((type) => (
                  <Badge key={type} variant="secondary">
                    {type}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="ml-1 h-4 w-4 p-0"
                      onClick={() => handleOtherSmokingTypeRemove(type)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="その他の喫煙種類を入力"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleOtherSmokingTypeAdd(e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={(e) => {
                    const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                    handleOtherSmokingTypeAdd(input.value);
                    input.value = '';
                  }}
                >
                  追加
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// SNSOptions component
interface SNSOptionsProps {
  hasSnsAccount: boolean;
  onHasSnsAccountChange: (hasAccount: boolean) => void;
  snsUrls: string[];
  onSnsUrlsChange: (urls: string[]) => void;
}

const SNSOptions: React.FC<SNSOptionsProps> = ({
  hasSnsAccount,
  onHasSnsAccountChange,
  snsUrls,
  onSnsUrlsChange,
}) => {
  const handleSnsUrlAdd = (url: string) => {
    if (url.trim() && !snsUrls.includes(url)) {
      onSnsUrlsChange([...snsUrls, url]);
    }
  };

  const handleSnsUrlRemove = (url: string) => {
    onSnsUrlsChange(snsUrls.filter(u => u !== url));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>SNSアカウントの有無</Label>
        <Switch
          checked={hasSnsAccount}
          onCheckedChange={onHasSnsAccountChange}
        />
      </div>

      {hasSnsAccount && (
        <div>
          <Label>SNSアカウントのURL</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {snsUrls.map((url) => (
              <Badge key={url} variant="secondary">
                {url}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="ml-1 h-4 w-4 p-0"
                  onClick={() => handleSnsUrlRemove(url)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2 mt-2">
            <Input
              placeholder="SNSのURLを入力"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSnsUrlAdd(e.currentTarget.value);
                  e.currentTarget.value = '';
                }
              }}
            />
            <Button
              type="button"
              onClick={(e) => {
                const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                handleSnsUrlAdd(input.value);
                input.value = '';
              }}
            >
              追加
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

// StoreInformation component
interface StoreInformationProps {
  currentStores: {
    storeName: string;
    stageName: string;
  }[];
  onCurrentStoresChange: (stores: {
    storeName: string;
    stageName: string;
  }[]) => void;
  photoDiaryUrls: string[];
  onPhotoDiaryUrlsChange: (urls: string[]) => void;
}

const StoreInformation: React.FC<StoreInformationProps> = ({
  currentStores,
  onCurrentStoresChange,
  photoDiaryUrls,
  onPhotoDiaryUrlsChange,
}) => {
  const handleStoreAdd = () => {
    onCurrentStoresChange([...currentStores, { storeName: '', stageName: '' }]);
  };

  const handleStoreRemove = (index: number) => {
    onCurrentStoresChange(currentStores.filter((_, i) => i !== index));
  };

  const handleStoreUpdate = (index: number, field: 'storeName' | 'stageName', value: string) => {
    const newStores = [...currentStores];
    newStores[index] = { ...newStores[index], [field]: value };
    onCurrentStoresChange(newStores);
  };

  const handlePhotoDiaryUrlAdd = (url: string) => {
    if (url.trim() && !photoDiaryUrls.includes(url)) {
      onPhotoDiaryUrlsChange([...photoDiaryUrls, url]);
    }
  };

  const handlePhotoDiaryUrlRemove = (url: string) => {
    onPhotoDiaryUrlsChange(photoDiaryUrls.filter(u => u !== url));
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>現在在籍店舗/源氏名</Label>
          <Button type="button" variant="outline" onClick={handleStoreAdd}>
            店舗を追加
          </Button>
        </div>
        {currentStores.map((store, index) => (
          <div key={index} className="grid gap-4 p-4 border rounded-lg">
            <Input
              placeholder="店舗名"
              value={store.storeName}
              onChange={(e) => handleStoreUpdate(index, 'storeName', e.target.value)}
            />
            <Input
              placeholder="源氏名"
              value={store.stageName}
              onChange={(e) => handleStoreUpdate(index, 'stageName', e.target.value)}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleStoreRemove(index)}
            >
              削除
            </Button>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <Label>写メ日記が確認できるURL</Label>
        <div className="flex flex-wrap gap-2">
          {photoDiaryUrls.map((url) => (
            <Badge key={url} variant="secondary">
              {url}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="ml-1 h-4 w-4 p-0"
                onClick={() => handlePhotoDiaryUrlRemove(url)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="写メ日記のURLを入力"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handlePhotoDiaryUrlAdd(e.currentTarget.value);
                e.currentTarget.value = '';
              }
            }}
          />
          <Button
            type="button"
            onClick={(e) => {
              const input = e.currentTarget.previousElementSibling as HTMLInputElement;
              handlePhotoDiaryUrlAdd(input.value);
              input.value = '';
            }}
          >
            追加
          </Button>
        </div>
      </div>
    </div>
  );
};

export const TalentForm: React.FC = () => {
  const { toast } = useToast();
  const [healthState, setHealthState] = useState({
    allergies: {
      types: [] as AllergyType[],
      others: [] as string[],
      hasAllergy: false
    },
    smoking: {
      enabled: false,
      types: [] as SmokingType[],
      others: [] as string[]
    }
  });

  const [snsState, setSnsState] = useState({
    hasSnsAccount: false,
    snsUrls: [] as string[]
  });

  const [storeState, setStoreState] = useState({
    currentStores: [{ storeName: '', stageName: '' }],
    photoDiaryUrls: [] as string[]
  });

  const form = useForm<TalentProfileData>({
    resolver: zodResolver(talentProfileSchema),
    defaultValues: {
      height: 0,
      weight: 0,
      bodyType: "普通",
      faceVisibility: "全出し",
      allergies: {
        types: [],
        others: [],
        hasAllergy: false
      },
      smoking: {
        enabled: false,
        types: [],
        others: []
      },
      hasSnsAccount: false,
      snsUrls: [],
      currentStores: [],
      photoDiaryUrls: [],
      serviceTypes: [],
      availableIds: {
        types: [],
        others: []
      }
    }
  });

  const { mutate: createProfile, isPending } = useMutation({
    mutationFn: (data: TalentProfileData) => apiRequest('/api/talent/profile', { method: 'POST', body: data }),
    onSuccess: () => {
      toast({ title: 'プロフィールが作成されました。' });
    },
    onError: (err) => {
      toast({
        title: 'プロフィールの作成に失敗しました。',
        description: err instanceof Error ? err.message : '不明なエラーが発生しました。',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: TalentProfileData) => {
    createProfile(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <HealthOptions
          allergies={healthState.allergies}
          onAllergiesChange={(allergies) => {
            setHealthState({ ...healthState, allergies });
            form.setValue('allergies', allergies);
          }}
          smoking={healthState.smoking}
          onSmokingChange={(smoking) => {
            setHealthState({ ...healthState, smoking });
            form.setValue('smoking', smoking);
          }}
        />

        <SNSOptions
          hasSnsAccount={snsState.hasSnsAccount}
          onHasSnsAccountChange={(hasAccount) => {
            setSnsState({ ...snsState, hasSnsAccount: hasAccount });
            form.setValue('hasSnsAccount', hasAccount);
          }}
          snsUrls={snsState.snsUrls}
          onSnsUrlsChange={(urls) => {
            setSnsState({ ...snsState, snsUrls: urls });
            form.setValue('snsUrls', urls);
          }}
        />

        <StoreInformation
          currentStores={storeState.currentStores}
          onCurrentStoresChange={(stores) => {
            setStoreState({ ...storeState, currentStores: stores });
            form.setValue('currentStores', stores);
          }}
          photoDiaryUrls={storeState.photoDiaryUrls}
          onPhotoDiaryUrlsChange={(urls) => {
            setStoreState({ ...storeState, photoDiaryUrls: urls });
            form.setValue('photoDiaryUrls', urls);
          }}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={!form.formState.isValid || isPending}
        >
          {isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          プロフィールを作成
        </Button>
      </form>
    </Form>
  );
};