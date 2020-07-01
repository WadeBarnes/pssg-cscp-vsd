import { FormBase } from "../form-base";
import { OnInit, Component, Input } from "@angular/core";
import { DateAdapter, MAT_DATE_LOCALE, MAT_DATE_FORMATS, MatDialog, MatDialogConfig } from "@angular/material";
import { FormGroup, ControlContainer } from "@angular/forms";
import { MomentDateAdapter } from "@angular/material-moment-adapter";
import { MY_FORMATS, ApplicationType } from "../enums-list";
import { SignPadDialog } from "../../sign-dialog/sign-dialog.component";

@Component({
    selector: 'app-declaration-information',
    templateUrl: './declaration-information.component.html',
    styleUrls: ['./declaration-information.component.scss'],
    providers: [
        // `MomentDateAdapter` can be automatically provided by importing `MomentDateModule` in your
        // application's root module. We provide it at the component level here, due to limitations of
        // our example generation script.
        { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
        { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
    ],
})
export class DeclarationInformationComponent extends FormBase implements OnInit {
    @Input() formType: number;
    public form: FormGroup;
    ApplicationType = ApplicationType;
    eligible_name: string;

    constructor(
        private controlContainer: ControlContainer,
        private matDialog: MatDialog,
    ) {
        super();
    }

    ngOnInit() {
        this.form = <FormGroup>this.controlContainer.control;
        // console.log("declaration info component");
        // console.log(this.form);

        if (this.formType === ApplicationType.Victim_Application) {
            this.eligible_name = "Victims";
        }
        if (this.formType === ApplicationType.IFM_Application) {
            this.eligible_name = "Immediate Family Members";
        }
        if (this.formType === ApplicationType.Witness_Application) {
            this.eligible_name = "Witnesses";
        }

    }

    showSignPad(control): void {
        const dialogConfig = new MatDialogConfig();
        dialogConfig.disableClose = true;
        dialogConfig.autoFocus = true;

        const dialogRef = this.matDialog.open(SignPadDialog, dialogConfig);
        dialogRef.afterClosed().subscribe(
            data => {
                var patchObject = {};
                patchObject[control] = data;
                this.form.patchValue(
                    patchObject
                );
            },
            err => console.log(err)
        );
    }

}