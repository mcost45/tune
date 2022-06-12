import { NgModule } from '@angular/core';
import { SharedModule } from '../../../shared/shared.module';
import { AuthCallbackComponent } from './auth-callback.component';
import { AuthCallbackRoutingModule } from './auth-callback-routing.module';

@NgModule({
	declarations: [AuthCallbackComponent],
	imports: [SharedModule, AuthCallbackRoutingModule]
})
export class AuthCallbackModule {}
