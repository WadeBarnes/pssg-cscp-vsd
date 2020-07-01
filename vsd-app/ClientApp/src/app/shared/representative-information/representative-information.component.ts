import { OnInit, Component, Input } from "@angular/core";
import { FormBase } from "../form-base";
import { DateAdapter, MAT_DATE_LOCALE, MAT_DATE_FORMATS } from "@angular/material";
import { FormGroup, Validators, FormBuilder, ControlContainer, FormControl } from "@angular/forms";
import { MomentDateAdapter } from "@angular/material-moment-adapter";
import { MY_FORMATS, ApplicationType } from "../enums-list";
import { COUNTRIES_ADDRESS } from "../address/country-list";
import { REPRESENTATIVE_LIST } from "../../constants/representative-list";
import { FileBundle } from "../../models/file-bundle";
import { AddressHelper } from "../address/address.helper";
import { EmailValidator } from "../validators/email.validator";

@Component({
    selector: 'app-representative-information',
    templateUrl: './representative-information.component.html',
    styleUrls: ['./representative-information.component.scss'],
    providers: [
        // `MomentDateAdapter` can be automatically provided by importing `MomentDateModule` in your
        // application's root module. We provide it at the component level here, due to limitations of
        // our example generation script.
        { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
        { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
    ],
})
export class RepresentativeInformationComponent extends FormBase implements OnInit {
    @Input() formType: number;
    public form: FormGroup;
    ApplicationType = ApplicationType;
    provinceList: string[];
    relationshipList: string[];
    header: string;

    representativePhoneIsRequired: boolean = false;
    representativeEmailIsRequired: boolean = false;
    representativeAddressIsRequired: boolean = false;

    addressHelper = new AddressHelper();

    constructor(
        private controlContainer: ControlContainer,
    ) {
        super();
        var canada = COUNTRIES_ADDRESS.filter(c => c.name.toLowerCase() == 'canada')[0];
        this.provinceList = canada.areas;
        this.relationshipList = REPRESENTATIVE_LIST.name;
    }

    ngOnInit() {
        this.form = <FormGroup>this.controlContainer.control;
        // console.log("representative info component");
        // console.log(this.form);

        if (this.formType === ApplicationType.Victim_Application) {
            this.header = "Victim";
        }
        if (this.formType === ApplicationType.IFM_Application) {
            this.header = "Immediate Family Member";
        }
        if (this.formType === ApplicationType.Witness_Application) {
            this.header = "Witness";
        }

        this.form.get('completingOnBehalfOf').valueChanges.subscribe(value => {
            let representativeFirstName = this.form.get('representativeFirstName');
            let representativeLastName = this.form.get('representativeLastName');
            let representativePreferredMethodOfContact = this.form.get('representativePreferredMethodOfContact');

            representativeFirstName.clearValidators();
            representativeFirstName.setErrors(null);
            representativeLastName.clearValidators();
            representativeLastName.setErrors(null);
            representativePreferredMethodOfContact.clearValidators();
            representativePreferredMethodOfContact.setErrors(null);

            let useValidation = value === 100000002 || value === 100000003;
            this.setupRepresentativeContactInformation(this.form.get('representativePreferredMethodOfContact').value);  // Have to clear contact validators on contact method change
            if (useValidation) {
                representativeFirstName.setValidators([Validators.required]);
                representativeLastName.setValidators([Validators.required]);
                representativePreferredMethodOfContact.setValidators([Validators.required, Validators.min(100000000), Validators.max(100000002)]);

                representativeFirstName.markAsTouched();
                representativeFirstName.updateValueAndValidity();
                representativeLastName.markAsTouched();
                representativeLastName.updateValueAndValidity();
                representativePreferredMethodOfContact.markAsTouched();
                representativePreferredMethodOfContact.updateValueAndValidity();
            }
        });

        this.form.get('representativePreferredMethodOfContact').valueChanges.subscribe(value => {
            let contactMethod = parseInt(value);
            this.setupRepresentativeContactInformation(contactMethod);
        });
    }

    setupRepresentativeContactInformation(contactMethod: number): void {
        let phoneControl = this.form.get('representativePhoneNumber');
        let emailControl = this.form.get('representativeEmail');
        let emailConfirmControl = this.form.get('representativeConfirmEmail');

        this.addressHelper.clearAddressValidatorsAndErrors(this.form, 'representativeAddress');
        this.addressHelper.setAddressAsRequired(this.form, 'representativeAddress');

        phoneControl.setValidators([Validators.minLength(10), Validators.maxLength(10)]);
        phoneControl.setErrors(null);
        emailControl.setValidators([Validators.email]);
        emailControl.setErrors(null);
        emailConfirmControl.setValidators([Validators.email, EmailValidator('representativeEmail')]);
        emailConfirmControl.setErrors(null);

        if (contactMethod === 100000000) {
            phoneControl.setValidators([Validators.required, Validators.minLength(10), Validators.maxLength(10)]);
            this.representativePhoneIsRequired = true;
            this.representativeEmailIsRequired = false;
        } else if (contactMethod === 100000001) {
            emailControl.setValidators([Validators.required, Validators.email]);
            emailConfirmControl.setValidators([Validators.required, Validators.email, EmailValidator('representativeEmail')]);
            this.representativePhoneIsRequired = false;
            this.representativeEmailIsRequired = true;
        } else if (contactMethod === 100000002) {
            this.representativePhoneIsRequired = false;
            this.representativeEmailIsRequired = false;
        }

        this.representativeAddressIsRequired = true;

        phoneControl.markAsTouched();
        phoneControl.updateValueAndValidity();
        emailControl.markAsTouched();
        emailControl.updateValueAndValidity();
        emailConfirmControl.markAsTouched();
        emailConfirmControl.updateValueAndValidity();
    }

    onRepresentativeFileBundle(fileBundle: FileBundle) {
        try {
            // save the files submitted from the component for attachment into the submitted form.
            const patchObject = {};
            patchObject['legalGuardianFiles'] = fileBundle;

            let fileName = fileBundle.fileName[0] || "";
            this.form.get('legalGuardianFiles.filename').patchValue(fileName);

            let body = fileBundle.fileData.length > 0 ? fileBundle.fileData[0].split(',')[1] : "";
            this.form.get('legalGuardianFiles.body').patchValue(body);
        }
        catch (e) {
            console.log(e);
        }
    }
}